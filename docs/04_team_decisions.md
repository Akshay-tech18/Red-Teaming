# Team Decisions

This document records the decisions agreed upon for the initial MVP.

These decisions should be treated as the working baseline unless the team
explicitly agrees to change them.

---

## D-001 — Primary MVP Target

**Decision:** ShopAssist is the primary and only required AI agent target for
the MVP.

**Reason:** The project has a limited 20-day implementation timeline. The team
will prioritize one complete and reliable end-to-end security demonstration over
supporting multiple incomplete target agents.

**Stretch Goal:** Additional controlled agents may be implemented later if the
ShopAssist pipeline is stable.

---

## D-002 — Core Demo Vulnerability

**Decision:** The initial vulnerable version of ShopAssist will intentionally
allow a refund workflow bypass.

The protected action:

`issue_refund(order_id, amount)`

can execute without successful order verification in the vulnerable version.

**Purpose:** This intentional vulnerability is the centerpiece of the core demo:

Attack
→ Refund succeeds without required verification
→ `CRITICAL_ACTION`
→ Security fix is applied
→ Same attack is blocked
→ Attack is saved for regression testing

---

## D-003 — Guaranteed Attack Families

The following four attack families are guaranteed for the MVP:

1. Authority Impersonation
2. Tool Workflow Bypass
3. Multi-Turn Manipulation
4. Indirect Prompt Injection

---

## D-004 — Stretch Attack Families

The following attack families are optional:

1. Context or Conflicting Instructions
2. Data-Access Boundary Attacks

These will be considered only after the guaranteed attack families and the
adaptive retry/security evaluation flow are stable.

---

## D-005 — Outcome Labels

The project will use the following five core outcome labels:

- `SAFE`
- `ATTEMPT_BLOCKED`
- `PARTIAL_LEAK`
- `POLICY_VIOLATION`
- `CRITICAL_ACTION`

These labels should be used consistently across:

- Evaluation logic
- Findings
- APIs
- Stored run results
- Regression tests
- Frontend displays

---

## D-006 — Core Demo Flow

The locked architectural story for the MVP is:

Understand
→ Attack
→ Judge
→ Fix
→ Regression

The exact UI design and demo wording may change later, but all major components
should support this flow.

---

## D-007 — MVP Priority

The team's priority order is:

1. One stable target agent.
2. One reliable critical vulnerability demonstration.
3. Targeted attack generation.
4. Reliable security evaluation.
5. Vulnerable → Fixed → Regression demonstration.
6. Additional attack families.
7. Additional targets.

The team will prioritize reliability and depth over feature breadth.
