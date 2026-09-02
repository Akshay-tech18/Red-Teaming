import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_attack(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/attacks",
        json={
            "id": "A-001",
            "constraint_id": "C-001",
            "target_policy": "P-001",
            "attack_family": "test_family",
            "prompt": ["Hello"],
            "expected_label": "CRITICAL_ACTION"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["constraint_id"] == "C-001"
    assert "id" in data
