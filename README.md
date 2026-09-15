# AI Agent Guardian

## 1. Project Overview & Problem Statement

As AI agents move from simple chatbots to autonomous systems capable of executing business logic (issuing refunds, querying customer data, invoking APIs), generic red-teaming tools that only look for prompt injections are no longer sufficient. **AI Agent Guardian** is a specialized, end-to-end evaluation and measurement framework designed to red-team **application-specific business logic constraints**.

Instead of just checking if an agent generates "harmful text," AI Agent Guardian evaluates whether an agent violates strict business rules under adversarial pressure (e.g., *“Never issue a refund over $500 without manager approval”* or *“Never expose a different customer's private data”*). 

**Key Value Proposition:**
AI Agent Guardian moves beyond naive wrapper-based prototyping by introducing a rigorous, data-driven measurement pipeline. It executes multi-turn conversational attacks against stateful agents, collects high-fidelity execution traces (including internal tool calls and state mutations), and scores the outcomes using a hybrid evaluation engine combining rock-solid **Deterministic Checks** (for API execution boundaries) and an **LLM-as-a-Judge Semantic Engine** (for detecting subtle data leaks). It is built to catch architectural gaps—such as an agent splitting a $650 refund into two under-threshold calls to bypass a naive guardrail—and prove security postures quantitatively.

---

## 2. Core Features & Capabilities

- **Stateful Multi-Turn Attack Simulation:** Executes complex, multi-turn conversational payloads (e.g., impersonation, context manipulation, trust-building) against an AI agent to see if its logic breaks under sustained pressure.
- **Hybrid Evaluation Engine:**
  - *Deterministic Checks:* Inspects the backend execution trace to mathematically verify if restricted tools (`issue_refund`, `get_customer`) were executed maliciously, independent of the agent's textual response.
  - *Semantic Checks:* Uses an LLM-as-a-Judge (cached for stability) to evaluate agent responses for confidential data leaks (e.g., exposing proprietary supplier pricing).
- **Vulnerable vs. Protected Build Comparison:** Dynamically toggles agent behavior (via system prompts and API guardrails) to measure security regression and baseline improvements.
- **Execution Trace Viewer:** A full-stack UI that visualizes the exact sequence of `USER_MESSAGE`, `AGENT_MESSAGE`, `TOOL_CALL`, and `SECURITY_EVENT` blocks for deep forensic analysis.
- **Measurement & Noise Accounting:** Built-in tooling (`demo_cli.py`) to quantify judge non-determinism, handle rate limits gracefully via caching, and output confusion matrices for precision/recall across security policies.

---

## 3. Technical Architecture & System Design

**System Pipeline:**
```text
[ Attacker Payload ] ➔ [ Agent Loop (FastAPI) ] ➔ [ Tools & Guardrails ]
                               │                         │
                               ▼                         ▼
                      [ Trace Collector ] ⟵ [ Database State Mutations ]
                               │
                               ▼
               [ Hybrid Evaluation Engine (Judge) ]
                ├── Deterministic (checks.py)
                └── Semantic (LLM-as-a-judge)
                               │
                               ▼
                     [ Security Verdict ] (SAFE, CRITICAL_ACTION, etc.)
```

**Directory Structure & Responsibilities:**
- `backend/app/main.py`: The FastAPI server entry point.
- `backend/app/execution/`: Contains the `run_agent_loop` state machine that manages multi-turn agent execution and tool dispatching.
- `backend/app/agents/`: Defines the AI Agent implementations, including `ShopAssist` (with varying `Vulnerable` and `Protected` configurations) and the `LLMClient`.
- `backend/app/evaluation/`: The core evaluation engine. Includes `runner.py` (CLI executor), `checks.py` (Deterministic logic), `semantic.py` (LLM judge), and `status_diff.py` (regression analytics).
- `backend/scripts/`: Tooling for database seeding (`seed_db.py`) and pre-flight checks.
- `frontend/`: A React/Vite web application for interacting with the attack catalog and viewing execution traces visually.

**Role of AI/ML:**
- **Agent Intelligence:** The target agent is driven by an LLM (typically LLaMA3-70b or Gemini 1.5 Flash), executing tool calls based on user prompts.
- **LLM-as-a-Judge:** A secondary LLM is used exclusively in the evaluation layer (`semantic.py`) to grade subjective, semantic boundaries (like information disclosure) where deterministic rules fall short. A local semantic cache prevents non-deterministic flakiness during evaluation runs.

---

## 4. Tech Stack & Dependencies

- **Backend:** Python 3.10+, FastAPI, SQLAlchemy (Async ORM), Alembic (Migrations), asyncpg.
- **Frontend:** Node.js, React 18, Vite, TailwindCSS.
- **Database:** PostgreSQL (Designed for Neon Serverless or local Docker).
- **AI Providers:** Groq API (Primary LLM Engine for low latency), Google GenAI / Gemini (Fallback provider).
- **Runtime:** macOS / Linux / Windows WSL.

---

## 5. Prerequisites & Environment Setup

### System Requirements
- Python 3.10 or higher
- Node.js 18 or higher
- Docker & Docker Compose (for local PostgreSQL)

### Step 1: Backend Setup
```bash
git clone <repo-url>
cd Red-Teaming/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

### Step 2: Environment Configuration
Create a `backend/.env` file with the following keys:
```env
# Required: Groq API Key for the LLM models
GROQ_API_KEY=your_groq_api_key_here

# Optional: Fallback Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# The model identifier to use (e.g. for Groq)
LLM_MODEL=llama3-70b-8192

# Database connection string (Must match the docker-compose settings)
DATABASE_URL=postgresql+asyncpg://prisma_user:prisma_password@localhost:5433/prisma_db
```

### Step 3: Database Initialization
Start the local PostgreSQL container and seed the necessary constraints, agent builds, and 28-case attack corpus:
```bash
docker compose up -d
alembic upgrade head
python scripts/seed_db.py
```
*(Expected output: `Attacks upserted: 28`, `Constraints upserted: 4`)*

### Step 4: Frontend Setup
```bash
cd ../frontend
npm install
npm run build
```

---

## 6. Execution & Verification Instructions

### Running the Project

Start the **Backend API** in one terminal:
```bash
cd backend
source .venv/bin/activate
JUDGE_PROVIDER=groq uvicorn app.main:app --port 8000 --reload
```

Start the **Frontend UI** in a second terminal:
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:5173` in your browser. 

### How to Evaluate (Judge Verification)
1. **Pre-flight Check:** Run `JUDGE_PROVIDER=groq python backend/scripts/preflight_check.py` to verify your database, LLM provider, and APIs are healthy.
2. **Execute an Attack via UI:** Open the web app, navigate to the **Attacks Catalog**, and click on `GEN-VAR-001`. Run it against the **Vulnerable** build. The trace should output `CRITICAL_ACTION` as the agent executes unauthorized refunds.
3. **Verify Protection:** Run the exact same `GEN-VAR-001` attack against the **Protected** build. Watch the execution trace live as the tool guardrail trips, blocking the second transaction and returning a deterministic `ATTEMPT_BLOCKED` verdict.
4. **Regression Analytics:** To view the confusion matrix and statistical safety improvements across the entire corpus, run the CLI regression tool:
   ```bash
   cd backend
   JUDGE_PROVIDER=groq python scripts/demo_cli.py
   ```

### Troubleshooting
- **`[Errno 8] nodename nor servname provided`:** If using a cloud database (like Neon) instead of local Docker, Python's async DNS resolver on macOS can occasionally flake on the `-pooler` subdomain. Switch to your database's direct endpoint in the `.env` file to resolve this.
- **Rate Limiting / `LLM API Error 429`:** If the UI shows `ERROR` instead of `SAFE`/`BLOCKED`, your Groq API key has likely hit its 8000 TPM limit. Wait 60 seconds and run the attack again.
