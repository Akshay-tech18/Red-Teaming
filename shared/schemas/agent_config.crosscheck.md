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
- **Code** defines `get_customer_details(customer_id)` (`backend/app/tools/mock_tools.py:32`).
- My schema example uses `get_customer_details` (code-aligned).

**Resolve:** pick one canonical name. `get_customer_details` is the executable; I
recommend docs align to it (Member 1 renames 4 docs), and Member 3 aligns seed
rationale. Confirm with Member 2.

### F2 — Session-state key: `refund_verification_state` vs `order_verification_state`

- **Docs** (incl. day-2 rename and schema example): `refund_verification_state`.
- **Code** (`mock_tools.py`) and **seed** (`attacks_seed.json`): `order_verification_state`.

**Resolve:** lock one. Recommendation: `refund_verification_state` (docs already
canonical); code owner + Member 3 rename. Already an open item with Akshay.

### F3 — Verification-state values: `NOT_VERIFIED` vs `UNVERIFIED`

- `attack_scenarios.md` initial states: `NOT_VERIFIED` / `VERIFIED`.
- `attacks_seed.json`: `UNVERIFIED` ×12, `VERIFIED` ×2.

**Resolve:** one vocabulary. Recommendation: `UNVERIFIED` / `VERIFIED` (seed is the
executed artifact; scenarios are the source) — or states in a Pydantic enum owned
by Member 2. Needs a team/`Akshay` sign-off.

### F4 — `manager_approval_state` values: `NONE` vs `NOT_APPROVED`

- `attack_scenarios.md`: `NOT_APPROVED` (A-001/003/004/006), `NONE` (A-002).
- `attacks_seed.json`: `NONE` ×13, never expected `APPROVED`.

Prevailing `NONE` is the seed's de-facto "absent" spelling mapped to "not
APPROVED" in checks. **Resolve:** with `Akshay` — recommend the state carry
`APPROVED | NOT_APPROVED` (explicit two-value) and apply `NONE`/absence semantics
consistently. This is the already-pending confirmation.

### F5 — Seed `constraint_ids` include supporting constraints (Member 3)

Seed entries with non-scoring IDs: `C-006` ×2 (attack_001/002), `C-003`
(attack_003), `C-008` (attack_004), `C-005` (attack_005) — 5 of 13 entries.
Docs rule: **only C-001/C-002/C-004/C-009 may appear** in `constraint_ids`.

**Resolve (Member 3):** reduce each entry to its single primary scoring ID.
Canonical mapping below. The schema intentionally does not hard-code the MVP
scoring set (it allows all C-###); the rule lives in the docs.

**Status:** RESOLVED — evaluation branch seed (18 cases) uses only `C-001`/`C-002`/`C-004`/`C-009` as single primary scoring IDs.

### F6 — Seed `evaluation_type: HYBRID` ×5 (Member 3)

attack_001..005 are `HYBRID`; docs + schema enum allow only
`DETERMINISTIC | SEMANTIC`. Also `Constraint.evaluation_type` defaults to
`"HYBRID"` (`models/constraint.py:21`).

**Resolve (Member 3):** set each entry to its primary constraint's eval type;
**Resolve (Member 2):** change the model default (see F8).

**Status:** RESOLVED — evaluation branch seed uses only `DETERMINISTIC`/`SEMANTIC` (14 DETERMINISTIC, 4 SEMANTIC across 18 cases).

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
title for family #5 (recommend **Information Protection**):
`authority_impersonation`, `tool_workflow_bypass`, `data_access_boundary`,
`multi_turn_manipulation`, `information_protection`, `benign`.
Owners: M1 (docs naming), M2/M3 (enum + seed codes).

**Status:** RESOLVED (name = `confidential_information_disclosure`) — the
evaluation branch (`c5d102e`) established the canonical name for family #5 as
`confidential_information_disclosure` in `attacks_seed.json` (A-008/A-009/
borderline_003/004) and `attack_taxonomy.md`, overriding the earlier
`information_protection` recommendation. M1 docs (`constraint_mapping.md`,
`day2_constraint_review.md`) updated to match. `attack_families.py` enum is
still SCREAMING and unaligned (M2).

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
4. Drop `HYBRID` default → `DETERMINISTIC` or no default.
5. Consider `mvp_status` (ACTIVE/STRETCH) parity in the config schema — it is
   currently absent; recommend adding optional `mvp_status` for parity.

### F9 — Scenario set vs seed set not 1:1 (note, not an error)

9 scenarios (A-001..A-009) vs 18 seed entries (benign_001..004 +
borderline_001..005 + A-001..A-009); different order-id namespaces
(`ORD-1001..` vs `4471/5210`); C-009 CONF coverage split between the two
(scenarios → CONF-003 supplier pricing; seed → CONF-001/002/004).

**Resolve:** treat scenarios as the source corpus and the seed as a subset +
control cases; confirm when Member 3 locks the attack shape (Day 7).

### F10 — `benign` family semantics (docs note)

Seed defines `benign` ×4 with empty `constraint_ids` and `expected_label` SAFE.
Docs define no benign/reserved family. Recommend documenting `benign` as a
reserved family in the canonical list (done in F7 resolution).

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
| benign_001..004 | (empty) | (none) | DETERMINISTIC |
| borderline_001/002/005 | (empty) | (none) | DETERMINISTIC / SEMANTIC |
| borderline_003 | C-009 | C-009 | SEMANTIC |
| borderline_004 | C-009 | C-009 | SEMANTIC |

## 5. Owner map

| Fix | Owner | Blocked on |
| --- | --- | --- |
| F1 tool-name canonical | Team (docs M1, seed M3, code M2) | Akshay decision |
| F2 state-key rename | M2 (code) + M3 (seed) | — (M1 docs already renamed) |
| F3/F4 state values | Team / Akshay | Akshay confirmation |
| F5 constraint_ids | M3 | — (mapping above) |
| F6 eval types | M3 + M2 (model default) | — |
| F7 family vocabulary | M1 docs + M2 enum + M3 seed | — (canonical list above) |
| F8 model/API parity | M2 | Day-4 dependency on this schema |
| F10 benign reserved family | M1 (document) | — |

## 6. Suggested next step (Task 4: integration checkpoint)

Share this report + the schema with Members 2/3, agree the canonical items
(F1/F3/F4/F7), then apply the Member-1-side doc edits (F1 tool name, F7 family
naming) before Day 4's constraint-storage sync.

## 7. Resolution status

Status of the 10 findings, updated against the evaluation branch (`c5d102e`):

| Fix | Owner | Status |
| --- | --- | --- |
| F1 tool-name canonical | Team (docs M1, seed M3, code M2) | **DEFERRED** — docs keep `get_customer` as canonical; `get_customer_details` is the executable name. `extraction_from_policies.json` confirms this alignment via `tool_name_aliases: {get_customer: [get_customer_details]}`. Code/schema-example alignment tracked to Member 2. |
| F2 state-key rename | M2 (code) + M3 (seed) | **RESOLVED (M1 docs + seed)** — seed uses `refund_verification_state`, matching docs and schema. Code still `order_verification_state`. |
| F3/F4 state values | Team / Akshay | **RESOLVED (seed)** — `NOT_VERIFIED`/`VERIFIED` and `APPROVED`/`NOT_APPROVED`, matching the security docs. Code owner to confirm. |
| F5 constraint_ids | M3 | **RESOLVED** — seed (18 cases) uses only C-001/C-002/C-004/C-009 as single primary IDs. |
| F6 eval types | M3 + M2 (model default) | **RESOLVED (seed)** — no `HYBRID`; only DETERMINISTIC/SEMANTIC. Model default (`models/constraint.py`) still M2. |
| F7 family vocabulary | M1 docs + M2 enum + M3 seed | **RESOLVED (docs + seed)** — name is now `confidential_information_disclosure` per the evaluation branch; updated `constraint_mapping.md` + `day2_constraint_review.md`. `attack_families.py` enum still SCREAMING and unaligned (M2). |
| F8 model/API parity | M2 | OPEN — Day-4 dependency on this schema. |
| F9 scenario vs seed set | M3 | OPEN (note) — lock at Day 7. Seed is 18 cases (9 attack + 4 benign + 5 borderline). |
| F10 benign/reserved families | M1 (document) | **DONE** — `none`/`benign` documented as reserved control families in `constraint_mapping.md`. |

**Remaining owner checkpoints before Day 4:** F2 code rename (M2),
F6 model default (M2), F8 (models/API, M2), F1 final call (M2 confirmation),
F7 `attack_families.py` enum alignment (M2), F9 (M3, Day 7).