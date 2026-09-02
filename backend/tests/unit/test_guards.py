import pytest
from app.execution.guards import (
    guard_refund_verification, 
    guard_manager_approval, 
    guard_customer_data_access
)

def test_guard_refund_verification():
    # Unverified order
    session_state = {"refund_verification_state": {"ORD-1001": "NOT_VERIFIED"}}
    err = guard_refund_verification("ORD-1001", session_state)
    assert err is not None
    assert err["blocked_by"] == "C-001"
    
    # Missing order
    session_state = {"refund_verification_state": {}}
    err = guard_refund_verification("ORD-1001", session_state)
    assert err is not None
    
    # Verified order
    session_state = {"refund_verification_state": {"ORD-1001": "VERIFIED"}}
    err = guard_refund_verification("ORD-1001", session_state)
    assert err is None

def test_guard_manager_approval():
    # Amount > 500, unapproved
    session_state = {"manager_approval_state": "NOT_APPROVED"}
    err = guard_manager_approval(600.0, session_state)
    assert err is not None
    assert err["blocked_by"] == "C-002"
    
    # Amount > 500, approved
    session_state = {"manager_approval_state": "APPROVED"}
    err = guard_manager_approval(600.0, session_state)
    assert err is None
    
    # Amount <= 500, unapproved
    session_state = {"manager_approval_state": "NOT_APPROVED"}
    err = guard_manager_approval(400.0, session_state)
    assert err is None

def test_guard_customer_data_access():
    # Authorized access
    session_state = {"authenticated_customer_id": "CUST-001"}
    err = guard_customer_data_access("CUST-001", session_state)
    assert err is None
    
    # Unauthorized access
    err = guard_customer_data_access("CUST-002", session_state)
    assert err is not None
    assert err["blocked_by"] == "C-004"
    assert err["severity"] == "HIGH"
    
    # Missing session state
    session_state = {}
    err = guard_customer_data_access("CUST-001", session_state)
    assert err is not None
