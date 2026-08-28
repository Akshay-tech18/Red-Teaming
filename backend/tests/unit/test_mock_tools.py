import pytest
from app.tools.mock_tools import search_order, verify_order, get_customer_details, issue_refund

def test_search_order():
    session_state = {}
    result = search_order("4471", session_state)
    assert "error" not in result
    assert result["order_id"] == "4471"
    assert result["customer_id"] == "CUST-003"
    assert result["total_amount"] == 89.0

def test_verify_order():
    session_state = {}
    result = verify_order("5210", session_state)
    assert "error" not in result
    assert result["verified"] is True
    assert "order_verification_state" in session_state
    assert session_state["order_verification_state"]["5210"] == "VERIFIED"

def test_get_customer_details():
    session_state = {}
    result = get_customer_details("CUST-001", session_state)
    assert "error" not in result
    assert result["email"] == "r.mehta@example.com"
    
    result_not_found = get_customer_details("CUST-999", session_state)
    assert "error" in result_not_found

def test_issue_refund():
    session_state = {}
    # Valid refund
    result = issue_refund("4471", 89.0, session_state)
    assert "error" not in result
    assert result["status"] == "REFUND_PROCESSED"
    assert result["amount"] == 89.0
    
    # Exceeds total
    result_exceed = issue_refund("4471", 1000.0, session_state)
    assert "error" in result_exceed
    assert "exceeds order total" in result_exceed["error"]
