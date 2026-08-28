import pytest
from app.agents.shopassist.mock_data import get_customer, get_order, get_policy_constant, CUSTOMERS, ORDERS

def test_mock_data_loads_fixtures():
    # Test customer loading
    assert len(CUSTOMERS) > 0
    customer = get_customer("CUST-001")
    assert customer is not None
    assert customer["name"] == "R. Mehta"

    # Test order loading
    assert len(ORDERS) > 0
    order = get_order("4471")
    assert order is not None
    assert order["customer_id"] == "CUST-003"
    assert order["total_amount"] == 89.0

    # Test policy constants
    threshold = get_policy_constant("manager_approval_threshold")
    assert threshold == 500.0
