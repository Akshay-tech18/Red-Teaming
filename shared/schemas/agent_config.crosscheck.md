# Agent Config Schema — Cross-Check Report

> Day 3 · Task 3. Verifies `agent_config.schema.json` + `agent_config.schema.md`
> against the day-2 security docs, the evaluation seed, and Member 2's Pydantic
> models.
>
> Sources checked:
> - `shared/schemas/agent_config.schema.json` / `.schema.md` (new)
> - `docs/security/shopassist_constraints.md`
> - `docs/security/constraint_mapping.md`
> - `docs/security/attack_scenarios.md`
> - `backend/app/evaluation/attacks_seed.json`
> - `backend/app/models/constraint.py`, `tool.py`, `agent.py`
> - `shared/constants/attack_families.py`

---

## 1. Verdict

The schema is consistent with the day-2 model: the C-###/P-### formats, the
4-primary/4-supporting split, the 3-DETERMINISTIC + 1-SEMANTIC scoring set, and
the exclusion of runtime session state all match the canonical docs.

**Gaps found: 10 findings — 1 contract, 3 docs, 4 seed, 2 model/API.** None block
the schema itself; they are alignment items for members 2/3 plus naming fixes I
can apply in our docs.

## 2. Verified-consistent

| Item | Status |
| --- | --- |
| `constraint_id` pattern `^C-[0-9]{3}$` and the 9 C-### IDs | consistent across schema, constraints doc, mapping, scenarios, seed |
| `policy_id` pattern `^P-[0-9]{3}$` and P-001..P-005 | consistent |
| Scored set C-001/C-002/C-004/C-009, PRIMARY/SUPPORTING, no HYBRID | consistent (docs + schema enum `DETERMINISTIC|SEMANTIC`) |
| Severity enum LOW/MEDIUM/HIGH/CRITICAL | consistent |
| Config excludes session state | matches seed's separate `initial_session_state` |
| Day-3 example ("complete ShopAssist") | validates against schema (jsonschema) |

## 3. Findings

### F1 — Tool name: `get_customer` vs `get_customer_details` (docs vs code)

- **Docs** (`constraint_mapping.md`, `shopassist_constraints.md`, `attack_scenarios.md`)
  and the **seed rationale** say `get_customer(customer_id)`.
- **Code** originally defined `get_customer_details(customer_id)`
  (`backend/app/tools/mock_tools.py`) and `registry.py` registered that name.

**Resolve:** pick one canonical name. **RESOLVED** — code now uses `get_customer`
(Member 2 renamed `mock_tools.py` `get_customer_details` → `get_customer` and
updated `registry.py` to import/register `get_customer`). The schema example uses
`get_customer`. The only surviving `get_customer_details` reference is the
intentional backwards-compat alias in `extraction_from_policies.json`
(`tool_name_aliases: {get_customer: [get_customer_details]}`).

### F2 — Session-state key: `refund_verification_state` vs `order_verification_state`

- **Docs** (incl. day-2 rename and schema example): `refund_verification_state`.
- **Code** (`mock_tools.py`) and **seed** (`attacks_seed.json`) originally:
  `order_verification_state`.

**Resolve:** lock one. **RESOLVED** — code now writes `refund_verification_state`
(Member 2 updated `mock_tools.verify_order`) and the seed uses the same key, so all
three sources (docs, code, seed) agree on `refund_verification_state`.

### F3 — Verification-state values: `NOT_VERIFIED` vs `UNVERIFIED`

- `attack_scenarios.md` initial states: `NOT_VERIFIED` / `VERIFIED`.
- `attacks_seed.json`: `UNVERIFIED` ×12, `VERIFIED` ×2 (original seed).

**Resolve:** one vocabulary. **RESOLVED** — final seed uses `NOT_VERIFIED` ×6 and
`VERIFIED` ×4 across all cases; docs already use `NOT_VERIFIED`, so everything is
aligned on `NOT_VERIFIED` / `VERIFIED`.

### F4 — `manager_approval_state` values: `NONE` vs `NOT_APPROVED`

- `attack_scenarios.md`: `NOT_APPROVED`.
- `attacks_seed.json`: `NONE` ×13 (original seed) never expected `APPROVED`.

**Resolve:** with `Akshay`. **RESOLVED** — final seed uses `NOT_APPROVED` ×9,
`APPROVED` ×1, and omits the key where not relevant (×9), matching the docs'
explicit `APPROVED | NOT_APPROVED` vocabulary. `guard_manager_approval` in
`guards.py` treats anything other than `APPROVED` as blocking, so `NOT_APPROVED`
and absence are equivalent at the enforcement boundary.

### F5 — Seed `constraint_ids` include supporting constraints (Member 3)

Original seed entries carried non-scoring IDs: `C-006` ×2 (attack_001/002), `C-003`
(attack_003), `C-008` (attack_004), `C-005` (attack_005) — 5 of 13 entries.
Docs rule: **only C-001/C-002/C-004/C-009 may appear** in `constraint_ids`.

**Resolve (Member 3):** reduce each entry to its single primary scoring ID.
Canonical mapping below. The schema intentionally does not hard-code the MVP
scoring set (it allows all C-###); the rule lives in the docs.

**Status:** RESOLVED — final seed (19 cases) uses only `C-001`/`C-002`/`C-004`/`C-009` as single primary scoring IDs.

### F6 — Seed `evaluation_type: HYBRID` ×5 (Member 3)

Original attack_001..005 were `HYBRID`; docs + schema enum allow only
`DETERMINISTIC | SEMANTIC`. Also `Constraint.evaluation_type` originally defaulted
to `"HYBRID"` (`models/constraint.py`).

**Resolve (Member 3):** set each entry to its primary constraint's eval type;
**Resolve (Member 2):** change the model default.

**Status:** RESOLVED — final seed uses only `DETERMINISTIC`/`SEMANTIC` (15 DETERMINISTIC, 4 SEMANTIC across 19 cases), and `models/constraint.py` now defaults to `DETERMINISTIC`.

### F7 — Attack-family vocabulary inconsistent (3 sources)

| Source | C-009 family wording | Codes / spacing |
| --- | --- | --- |
| `constraint_mapping.md` | Confidential Information Disclosure | Title Case, spaces; `Data-Access Boundary` |
| `attack_scenarios.md` | Information Protection | Title Case, spaces; `Data Access Boundary` |
| `attacks_seed.json` | (n/a in seed) | snake_case: `authority_impersonation`, `tool_workflow_bypass`, `multi_turn_manipulation`, `data_access_boundary`, `conflicting_instructions`, `benign` |
| `attack_families.py` | (n/a) | SCREAMING: 3 active + stretch `INDIRECT_PROMPT_INJECTION`, `CONTEXT_CONFLICT`, `DATA_ACCESS_BOUNDARY` |

Mismatches: C-009 family name differs between the two docs; seed codes
`conflicting_instructions` and `benign` exist in no enum; the seed treats
`data_access_boundary` as active while the enum lists it as a stretch goal.

**Resolve:** canonical 5 active families + `benign`, with snake_case codes and one
title for family #5 (final agreement — **Confidential Information Disclosure**):
`authority_impersonation`, `tool_workflow_bypass`, `data_access_boundary`,
`multi_turn_manipulation`, `confidential_information_disclosure`, `benign`.
Owners: M1 (docs naming), M2/M3 (enum + seed codes).

**Status:** RESOLVED (name = `confidential_information_disclosure`) — the
evaluation branch (`c5d102e`) established the canonical name for family #5 as
`confidential_information_disclosure` in `attacks_seed.json` (A-008/A-009/
borderline_003/004) and `attack_taxonomy.md`, overriding the earlier
`information_protection` recommendation. M1 docs (`constraint_mapping.md`,
`day2_constraint_review.md`) updated to match. `attack_families.py` enum is
still SCREAMING and unaligned (M2, open).

### F8 — Constraint/Tool models vs schema fields (Member 2, Day-4 work)

`models/constraint.py` currently stores: `id`(=constraint_id), `policy_id`
(single), `description`, `protected_action`, `required_condition` (**JSON dict**),
`severity`, `evaluation_type`, `mvp_status`.

Schema requires additionally: `name`, `protected_asset`, `forbidden_behavior`,
`attack_objective`; allows multiple `source_policy_ids`; defines
`required_condition` as a **string**.

`models/tool.py` has `name/description/input_schema/output_schema` — fine; the
optional `preconditions`/`side_effects` are **not** modeled.

**Resolve (Member 2, Day-4 adapt):**
1. Add columns for the 4 missing schema-required constraint fields.
2. Support multiple policy refs (C-003/C-006/C-008 map to 2–4 policies).
3. Align `required_condition` representation (string in config vs structured
   JSON in DB — decide the canonical type now; recommend schema string is the
   contract, DB may store structured).
4. ~~Drop `HYBRID` default~~ — DONE, model now defaults to `DETERMINISTIC`.
5. Consider `mvp_status` (ACTIVE/STRETCH) parity in the config schema — it is
   currently absent; recommend adding optional `mvp_status` for parity.

**Status:** PARTIAL — items 1–3, 5 still open (Member 2, Day-4); item 4 resolved.

### F9 — Scenario set vs seed set not 1:1 (note, not an error)

9 scenarios (A-001..A-009) vs 19 seed entries (benign_001..005 +
borderline_001..005 + A-001..A-009); order-id namespaces are now aligned on
`ORD-1001..`/`ORD-3001` across both; C-009 CONF coverage split between the two
(scenarios → CONF-003 supplier pricing; seed → CONF-001/002/004).

**Resolve:** treat scenarios as the source corpus and the seed as a subset +
control cases; confirm when Member 3 locks the attack shape (Day 7).

### F10 — `benign` family semantics (docs note)

Seed defines `benign` ×5 (benign_001..005) with empty `constraint_ids` and
`expected_label` SAFE. Docs define no benign/reserved family. Recommend documenting
`benign` as a reserved family in the canonical list (done in F7 resolution).

## 4. Canonical scoring mapping for Member 3

| Seed entry | Current `constraint_ids` | Canonical (single primary) | Eval type |
| --- | --- | --- | --- |
| A-001 | C-001 | C-001 | DETERMINISTIC |
| A-002 | C-002 | C-002 | DETERMINISTIC |
| A-003 | C-001 | C-001 | DETERMINISTIC |
| A-004 | C-002 | C-002 | DETERMINISTIC |
| A-005 | C-004 | C-004 | DETERMINISTIC |
| A-006 | C-001 | C-001 | DETERMINISTIC |
| A-007 | C-004 | C-004 | DETERMINISTIC |
| A-008 | C-009 | C-009 | SEMANTIC |
| A-009 | C-009 | C-009 | SEMANTIC |
| benign_001..005 | (empty) | (none) | DETERMINISTIC |
| borderline_001/002/005 | (empty) | (none) | DETERMINISTIC / SEMANTIC |
| borderline_003 | C-009 | C-009 | SEMANTIC |
| borderline_004 | C-009 | C-009 | SEMANTIC |

## 5. Owner map

| Fix | Owner | Blocked on |
| --- | --- | --- |
| F1 tool-name canonical | Team (docs M1, seed M3, code M2) | — (RESOLVED — code now `get_customer`) |
| F2 state-key rename | M2 (code) + M3 (seed) | — (RESOLVED — code on `refund_verification_state`) |
| F3/F4 state values | Team / Akshay | — (RESOLVED — seed/docs/guards aligned) |
| F5 constraint_ids | M3 | — (RESOLVED — mapping above) |
| F6 eval types | M3 + M2 (model default) | — (RESOLVED — default DETERMINISTIC; seed 15+4) |
| F7 family vocabulary | M1 docs + M2 enum + M3 seed | `attack_families.py` enum alignment (M2, open) |
| F8 model/API parity | M2 | Day-4 dependency on this schema |
| F10 benign reserved family | M1 (document) | — (DONE) |

## 6. Suggested next step (Task 4: integration checkpoint)

Canonical items agreed and applied on the Member-1 side (F1 tool name, F3/F4
state values, F7 family naming, F10 reserved families). Remaining checkpoint
before Day 4: Member 2 to align the `attack_families.py` enum (F7) and adapt the
models/API layer to this schema (F8).

## 7. Resolution status

Status of the 10 findings, updated against the evaluation branch (`c5d102e`)
and the merged `member1/day3` code state:

| Fix | Owner | Status |
| --- | --- | --- |
| F1 tool-name canonical | Team (docs M1, seed M3, code M2) | **RESOLVED** — code, docs, schema, and seed all use the single tool name `get_customer`. `extraction_from_policies.json` keeps `tool_name_aliases: {get_customer: [get_customer_details]}` as an intentional backwards-compat alias. |
| F2 state-key rename | M2 (code) + M3 (seed) | **RESOLVED** — `refund_verification_state` everywhere: docs, schema, code (`mock_tools.verify_order`), seed, and evaluator. |
| F3/F4 state values | Team / Akshay | **RESOLVED** — `NOT_VERIFIED`/`VERIFIED` and `APPROVED`/`NOT_APPROVED` across docs, seed, and guards (`guard_manager_approval` blocks anything but `APPROVED`). |
| F5 constraint_ids | M3 | **RESOLVED** — seed (19 cases) uses only C-001/C-002/C-004/C-009 as single primary IDs. |
| F6 eval types | M3 + M2 (model default) | **RESOLVED** — no `HYBRID` anywhere: seed (19 cases) is 15 DETERMINISTIC + 4 SEMANTIC, and `models/constraint.py` now defaults to `DETERMINISTIC`. |
| F7 family vocabulary | M1 docs + M2 enum + M3 seed | **RESOLVED (docs + seed)** — canonical name is `confidential_information_disclosure` per the evaluation branch; updated `constraint_mapping.md` + `day2_constraint_review.md`. `attack_families.py` enum still SCREAMING and unaligned (M2, open). |
| F8 model/API parity | M2 | OPEN — Day-4 dependency on this schema. |
| F9 scenario vs seed set | M3 | OPEN (note) — lock at Day 7. Seed is 19 cases (9 attack + 5 benign + 5 borderline); order-id namespaces aligned on `ORD-1001..`/`ORD-3001`. |
| F10 benign/reserved families | M1 (document) | **DONE** — `none`/`benign` documented as reserved control families in `constraint_mapping.md`. |

**Remaining owner checkpoints before Day 4:** F7 `attack_families.py` enum
alignment (M2), F8 (models/API, M2), F9 (M3, Day 7).