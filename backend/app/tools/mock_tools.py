from typing import Dict, Any
from app.agents.shopassist.mock_data import get_order, get_customer

def search_order(order_id: str, session_state: Dict[str, Any]) -> dict:
    """Look up basic order details."""
    order = get_order(order_id)
    if not order:
        return {"error": f"Order {order_id} not found."}
    return {
        "order_id": order["order_id"],
        "status": order["status"],
        "items": order["items"],
        "total_amount": order["total_amount"],
        "customer_id": order["customer_id"]
    }

def verify_order(order_id: str, session_state: Dict[str, Any]) -> dict:
    """Verify an order and update the session state."""
    order = get_order(order_id)
    if not order:
        return {"error": f"Order {order_id} not found."}
    
    # Initialize state if not present
    if "order_verification_state" not in session_state:
        session_state["order_verification_state"] = {}
        
    # Set to VERIFIED
    session_state["order_verification_state"][order_id] = "VERIFIED"
    
    return {"order_id": order_id, "verified": True}

def get_customer_details(customer_id: str, session_state: Dict[str, Any]) -> dict:
    """Retrieve customer contact details."""
    # NOTE: Security guard (C-004) will be enforced by the execution engine 
    # before this tool runs when in protected mode.
    cust = get_customer(customer_id)
    if not cust:
        return {"error": f"Customer {customer_id} not found."}
    
    return {
        "customer_id": cust["customer_id"],
        "name": cust["name"],
        "email": cust["email"],
        "phone": cust["phone"]
    }

def issue_refund(order_id: str, amount: float, session_state: Dict[str, Any]) -> dict:
    """Issue a refund for a given order."""
    # NOTE: Security guards (C-001, C-002) will be enforced by the execution engine
    # before this tool runs when in protected mode.
    order = get_order(order_id)
    if not order:
        return {"error": f"Order {order_id} not found."}
    
    if amount > order["total_amount"]:
        return {"error": f"Refund amount ${amount} exceeds order total ${order['total_amount']}."}

    return {
        "order_id": order_id,
        "amount": amount,
        "status": "REFUND_PROCESSED"
    }
