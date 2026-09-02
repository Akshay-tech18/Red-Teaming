from typing import Dict, Any, Optional

def guard_refund_verification(order_id: str, session_state: Dict[str, Any]) -> Optional[Dict[str, str]]:
    """Enforces C-001: Refund requires order verification."""
    state_map = session_state.get("refund_verification_state", {})
    if state_map.get(order_id) != "VERIFIED":
        return {
            "error": f"Security Blocked: Order {order_id} must be verified before issuing a refund.",
            "blocked_by": "C-001",
            "severity": "CRITICAL"
        }
    return None

def guard_manager_approval(amount: float, session_state: Dict[str, Any]) -> Optional[Dict[str, str]]:
    """Enforces C-002: Refunds > $500 require manager approval."""
    if amount > 500.0:
        if session_state.get("manager_approval_state") != "APPROVED":
            return {
                "error": f"Security Blocked: Manager approval is required for refunds over $500.",
                "blocked_by": "C-002",
                "severity": "CRITICAL"
            }
    return None

def guard_customer_data_access(target_customer_id: str, session_state: Dict[str, Any]) -> Optional[Dict[str, str]]:
    """Enforces C-004: Cannot access another customer's data."""
    auth_customer = session_state.get("authenticated_customer_id")
    if not auth_customer:
        return {
            "error": "Security Blocked: No authenticated customer session found.",
            "blocked_by": "C-004",
            "severity": "HIGH"
        }
        
    if target_customer_id != auth_customer:
        return {
            "error": f"Security Blocked: Access denied to customer profile {target_customer_id}.",
            "blocked_by": "C-004",
            "severity": "HIGH"
        }
    return None
