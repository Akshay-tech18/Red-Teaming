# AI Agent Guardian — Project Overview

## What This Project Is

AI Agent Guardian is a security testing system for AI agents.

Red-team tools are useful for known attack patterns, but they do not
automatically know an application's unique rules. One agent must never expose
another customer's records; another must never issue a refund without
verification. AI Agent Guardian turns those app-specific constraints into attack
objectives.

The system is not a generic jailbreak detector. It understands the security
rules of a specific AI agent and uses those rules to generate, execute, and
evaluate targeted attacks.

## MVP Target

The primary MVP target is **ShopAssist**, a controlled e-commerce
customer-support AI agent operating on mock data and mock tools.

The main demonstration focuses on a refund workflow bypass in which an attack
attempts to cause ShopAssist to execute a refund without successful order
verification.

## Core Security Loop

The project is built around the following loop:

```text
Understand
→ Attack
→ Judge
→ Fix
→ Regression
```

## Document Structure

The project documentation is organized as follows:

```text
docs/
├── 01_project_overview.md
├── 02_problem_statement.md
├── 03_mvp_scope.md
├── 04_team_decisions.md
├── 05_demo_flow.md
└── security/
    ├── policies.md
    ├── shopassist_constraints.md
    ├── constraint_mapping.md
    ├── day2_constraint_review.md
    ├── attack_success_criteria.md
    ├── severity_model.md
    ├── attack_scenario_template.md
    ├── attack_scenarios.md
    └── attack_evaluation_rules.md
```

## Suggested Reading Order

1. `02_problem_statement.md` — why application-aware AI agent security testing
   is needed.
2. `03_mvp_scope.md` — what the MVP will and will not build.
3. `04_team_decisions.md` — the locked working baseline for the MVP.
4. `05_demo_flow.md` — the end-to-end demo story.

The `security/` directory defines the security model:

- `policies.md` — Day 1 security policies (P-001 to P-005).
- `shopassist_constraints.md` — the explicit, testable constraints (C-001 to
  C-009, with C-007 as stretch).
- `constraint_mapping.md` — how every constraint maps to the implementation.
- `day2_constraint_review.md` — the review that locked the final constraint set.
- `attack_success_criteria.md` — the shared outcome labels.
- `severity_model.md` — the severity model.
- `attack_scenario_template.md` — the standard attack scenario format.
- `attack_scenarios.md` — the concrete attack scenarios (A-001 to A-009).
- `attack_evaluation_rules.md` — how attack results are evaluated.