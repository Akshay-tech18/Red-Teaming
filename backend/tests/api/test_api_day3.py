import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_day3_endpoints(async_client: AsyncClient):
    # 1. Create an Agent
    res = await async_client.post("/api/v1/agents", json={"name": "Test Agent", "description": "Test"})
    assert res.status_code == 201
    agent_id = res.json()["id"]

    # 2. Test Versions API
    res = await async_client.post(
        f"/api/v1/agents/{agent_id}/versions",
        json={
            "version_label": "v1.0",
            "system_prompt": "You are a test agent",
            "protected_tools": [],
            "tool_config": {}
        }
    )
    assert res.status_code == 201
    version_id = res.json()["id"]

    res = await async_client.get(f"/api/v1/agents/{agent_id}/versions")
    assert res.status_code == 200
    assert len(res.json()) == 1

    # 3. Create Attack
    res = await async_client.post(
        "/api/v1/attacks",
        json={
            "id": "A-DAY3-TEST",
            "constraint_id": "C-001",
            "target_policy": "P-001",
            "attack_family": "test_family",
            "prompt": ["test"],
            "expected_label": "SAFE"
        }
    )
    assert res.status_code == 201
    attack_id = res.json()["id"]

    # 4. Create Run
    res = await async_client.post(
        f"/api/v1/attacks/{attack_id}/run",
        json={
            "agent_version_id": version_id
        }
    )
    assert res.status_code == 201
    run_id = res.json()["id"]

    # 5. Test Findings API
    res = await async_client.post(
        f"/api/v1/runs/{run_id}/findings",
        json={
            "case_id": "A-DAY3-TEST",
            "build": "vulnerable",
            "evaluation_type": "SEMANTIC",
            "n_runs": 5,
            "verdicts": ["SAFE", "SAFE"],
            "verdict_counts": {"SAFE": 2},
            "unanimous": True,
            "has_majority": True,
            "majority_verdict": "SAFE",
            "worst_observed": "SAFE",
            "judge_provider": "groq",
            "judge_model": "gpt-120b",
            "prompt_version": "v1",
            "trace_refs": []
        }
    )
    assert res.status_code == 201
    finding_id = res.json()["id"]

    res = await async_client.get(f"/api/v1/runs/{run_id}/findings")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["majority_verdict"] == "SAFE"

    # 6. Test Regression API
    res = await async_client.post(
        f"/api/v1/runs/{run_id}/regressions",
        json={
            "case_id": "A-DAY3-TEST",
            "build": "vulnerable",
            "old_label": "SAFE",
            "new_label": "POLICY_VIOLATION",
            "status_diff": "BOUNDARY_CROSSING",
            "evidence": {
                "tool": "issue_refund",
                "call_count": 2,
                "successful_call_count": 1,
                "cumulative_amount": 200.0,
                "order_total": 200.0
            }
        }
    )
    assert res.status_code == 201

    res = await async_client.get(f"/api/v1/runs/{run_id}/regressions")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["status_diff"] == "BOUNDARY_CROSSING"

