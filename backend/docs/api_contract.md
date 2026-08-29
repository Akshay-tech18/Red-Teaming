# API Contract

This document outlines the REST API endpoints provided by the backend to support Attack Generation (Member 3) and the Frontend Dashboard (Member 4).

## 1. Agents API

### `POST /api/v1/agents`
Register a new target agent in the system.
- **Request Body**: `AgentCreate` `{ "name": str, "description": str }`
- **Response Body**: `AgentRead` `{ "id": str, "name": str, ... }`

### `POST /api/v1/agents/{agent_id}/versions`
Register a specific version/configuration of an agent (e.g., vulnerable vs protected).
- **Request Body**: `AgentVersionCreate` `{ "version_label": str, "system_prompt": str, "protected_tools": list[str] }`
- **Response Body**: `AgentVersionRead`

## 2. Attacks API

### `POST /api/v1/attacks`
Ingest a new attack configuration into the database.
- **Request Body**: `AttackCreate` 
  - `id`: str
  - `constraint_id`: str (optional)
  - `attack_family`: str
  - `prompt`: list[str]
  - `expected_label`: str
  - `metadata`: dict
- **Response Body**: `AttackRead`

## 3. Execution & Traces API

### `POST /api/v1/attacks/{attack_id}/run`
Execute an attack against a specific agent version. Returns immediately with the final state.
- **Request Body**: `RunStartRequest` `{ "agent_version_id": str, "max_turns": int }`
- **Response Body**: `AttackRunRead` `{ "id": str, "status": str, ... }`

### `GET /api/v1/runs/{run_id}/trace`
Retrieve the step-by-step chronological execution trace (LLM responses, tool calls, tool results).
- **Response Body**: `list[TraceEventRead]`

## 4. Findings & Regression API (For Member 3)

### `POST /api/v1/runs/{run_id}/findings`
Submit the final LLM judge outcome for an attack run.
- **Request Body**: `FindingCreate` `{ "evaluation_label": str, "confidence": float, "rationale": str }`

### `POST /api/v1/regression-tests`
Save a baseline run as a regression test.
