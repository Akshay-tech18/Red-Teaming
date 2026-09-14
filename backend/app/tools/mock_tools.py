from typing import Dict, Any
from app.agents.shopassist.mock_data import get_order, get_customer as fetch_customer

def search_order(order_id: str, session_state: Dict[str, Any]) -> dict:
    """Look up basic order details."""
    order = get_order(order_id)
    if not order:
        return {"error": f"Order {order_id} not found."}
    return {
        "order_id": order["order_id"],
        "status": order.get("status", "SHIPPED"),
        "items": order.get("items", []),
        "total_amount": order["total_amount"],
        "customer_id": order["customer_id"]
    }

def verify_order(order_id: str, session_state: Dict[str, Any]) -> dict:
    """Verify an order and update the session state."""
    order = get_order(order_id)
    if not order:
        return {"error": f"Order {order_id} not found."}
        
    auth_customer = session_state.get("authenticated_customer_id")
    if order["customer_id"] != auth_customer:
        return {"error": f"Order {order_id} does not belong to the current customer."}
    if not order.get("return_window_active", False):
        return {"error": "Verification failed: Order is outside the active return window."}
    # Initialize state if not present
    if "refund_verification_state" not in session_state:
        session_state["refund_verification_state"] = {}
        
    # Set to VERIFIED
    session_state["refund_verification_state"][order_id] = "VERIFIED"
    
    return {"order_id": order_id, "verified": True}

def get_customer(customer_id: str, session_state: Dict[str, Any]) -> dict:
    """Retrieve customer contact details."""
    # NOTE: Security guard (C-004) will be enforced by the execution engine 
    # before this tool runs when in protected mode.
    cust = fetch_customer(customer_id)
    if not cust:
        return {"error": f"Customer {customer_id} not found."}
    
    return {
        "customer_id": cust["customer_id"],
        "name": cust["name"],
        "email": cust.get("email", f"{cust['customer_id'].lower()}@example.com"),
        "phone": cust.get("phone", "555-0000")
    }

def issue_refund(order_id: str, amount: float, session_state: Dict[str, Any]) -> dict:
    """Issue a refund for a given order."""
    # NOTE: Security guards (C-001, C-002) will be enforced by the execution engine
    # before this tool runs when in protected mode.
    order = get_order(order_id)
    if not order:
        return {"error": f"Order {order_id} not found."}
    
    if "refunded_amounts" not in session_state:
        session_state["refunded_amounts"] = {}
        
    previously_refunded = session_state["refunded_amounts"].get(order_id, 0.0)
    cumulative_amount = previously_refunded + amount
    
    if cumulative_amount > order["total_amount"]:
        return {"error": f"Cumulative refund amount ${cumulative_amount} exceeds order total ${order['total_amount']}."}
        
    session_state["refunded_amounts"][order_id] = cumulative_amount

    return {
        "order_id": order_id,
        "amount": amount,
        "status": "REFUND_PROCESSED"
    }
