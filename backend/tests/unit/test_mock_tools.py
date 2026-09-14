import pytest
from app.tools.mock_tools import search_order, verify_order, get_customer, issue_refund

def test_search_order():
    session_state = {}
    result = search_order("ORD-1001", session_state)
    assert "error" not in result
    assert result["order_id"] == "ORD-1001"
    assert result["customer_id"] == "CUST-001"
    
    result_not_found = search_order("9999", session_state)
    assert "error" in result_not_found

def test_verify_order():
    # Test successful verification (eligible order)
    session_state = {"authenticated_customer_id": "CUST-001"}
    result = verify_order("ORD-1005", session_state)
    assert "error" not in result
    assert result["verified"] is True
    assert "refund_verification_state" in session_state
    assert session_state["refund_verification_state"]["ORD-1005"] == "VERIFIED"
    
    # Test ineligible order (outside return window)
    result_ineligible = verify_order("ORD-1002", session_state)
    assert "error" in result_ineligible
    assert "Verification failed" in result_ineligible["error"]
    
    # Test ownership check (order belongs to CUST-002)
    session_state_other = {"authenticated_customer_id": "CUST-001"}
    result_invalid = verify_order("ORD-2001", session_state_other)
    assert "error" in result_invalid
    assert "does not belong" in result_invalid["error"]

def test_get_customer():
    session_state = {}
    result = get_customer("CUST-001", session_state)
    assert "error" not in result
    assert result["name"] == "Alex Rivera"
    
    result_not_found = get_customer("CUST-999", session_state)
    assert "error" in result_not_found

def test_issue_refund():
    session_state = {}
    # Valid refund
    result = issue_refund("ORD-1001", 250.0, session_state)
    assert "error" not in result
    assert result["status"] == "REFUND_PROCESSED"
    assert result["amount"] == 250.0
    
    # Invalid refund
    result_not_found = issue_refund("9999", 50.0, session_state)
    assert "error" in result_not_found
