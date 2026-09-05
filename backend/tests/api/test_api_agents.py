import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_agent(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/agents",
        json={
            "name": "Test Agent",
            "description": "A test agent"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Agent"
    assert "id" in data
    
    agent_id = data["id"]
    
    # Create an agent version
    version_response = await async_client.post(
        f"/api/v1/agents/{agent_id}/versions",
        json={
            "version_label": "v1",
            "system_prompt": "You are a helpful test agent.",
            "protected_tools": ["issue_refund"]
        }
    )
    assert version_response.status_code == 201
    v_data = version_response.json()
    assert v_data["version_label"] == "v1"
    assert "issue_refund" in v_data["protected_tools"]
