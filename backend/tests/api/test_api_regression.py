import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_regression_test_not_found(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/regression-tests",
        json={
            "attack_id": "dummy_attack",
            "baseline_run_id": "dummy_run"
        }
    )
    # Should be 404 because baseline run doesn't exist
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_list_regression_tests(async_client: AsyncClient):
    response = await async_client.get("/api/v1/regression-tests")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
