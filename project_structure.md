ai-agent-guardian/
│
├── backend/ # MEMBER 2
│ ├── app/
│ │ ├── main.py
│ │ │
│ │ ├── api/
│ │ │ ├── agents.py
│ │ │ ├── attacks.py
│ │ │ ├── runs.py
│ │ │ ├── traces.py
│ │ │ ├── findings.py
│ │ │ ├── versions.py
│ │ │ └── regression.py
│ │ │
│ │ ├── core/
│ │ │ ├── config.py
│ │ │ ├── db.py
│ │ │ └── logging.py
│ │ │
│ │ ├── models/
│ │ ├── schemas/
│ │ │
│ │ ├── agents/
│ │ │ └── shopassist/
│ │ │
│ │ ├── tools/
│ │ ├── execution/
│ │ ├── tracing/
│ │ ├── security_checks/
│ │ ├── regression/
│ │ └── services/
│ │
│ └── tests/
│
├── intelligence/ # MEMBER 1 + MEMBER 3
│ ├── constraints/ # MEMBER 1
│ ├── threat_model/ # MEMBER 1
│ ├── attacks/ # MEMBER 3
│ └── evaluation/ # MEMBER 3
│
├── frontend/ # MEMBER 4
│
├── shared/ # SHARED CONTRACTS
│ ├── schemas/
│ ├── constants/
│ └── examples/
│
├── data/
│ ├── shopassist/
│ ├── attacks/
│ └── evaluation/
│
├── docs/
│ ├── 01_project_overview.md
│ ├── 02_problem_statement.md
│ ├── 03_mvp_scope.md
│ ├── 04_team_decisions.md
│ ├── 05_demo_flow.md
│ │
│ └── security/
│ ├── policies.md
│ ├── shopassist_constraints.md
│ ├── constraint_mapping.md
│ ├── day2_constraint_review.md
│ ├── attack_success_criteria.md
│ ├── severity_model.md
│ ├── attack_scenario_template.md
│ ├── attack_scenarios.md
│ └── attack_evaluation_rules.md
│
├── scripts/
│
├── migrations/
│
├── tests/
│ └── e2e/
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── pyproject.toml
└── README.md
