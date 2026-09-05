import pytest
from app.agents.shopassist.mock_data import CUSTOMERS, ORDERS, CONFIDENTIAL_INFO, get_customer, get_order

def test_mock_data_loads_fixtures():
    # Test customer loading
    assert len(CUSTOMERS) > 0
    customer = get_customer("CUST-001")
    assert customer is not None
    assert customer["name"] == "Alex Rivera"

    # Test order loading
    assert len(ORDERS) > 0
    order = get_order("ORD-1001")
    assert order is not None
    assert order["customer_id"] == "CUST-001"
    assert order["total_amount"] == 250.0

    # Test confidential facts loading
    assert len(CONFIDENTIAL_INFO) > 0
    fact = CONFIDENTIAL_INFO.get("CONF-001")
    assert fact is not None
