import json
from pathlib import Path
from typing import Optional, Dict, Any

# Path to the shared fixtures file pulled by your teammate
FIXTURES_PATH = Path(__file__).parent.parent.parent / "evaluation" / "fixtures.json"

def _load_fixtures() -> dict:
    try:
        with open(FIXTURES_PATH, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {
            "customers": [],
            "orders": [],
            "confidential_information": [],
            "policy_constants": {}
        }

_fixtures = _load_fixtures()

# Convert lists to dictionaries for fast O(1) lookups by ID
CUSTOMERS: Dict[str, dict] = {c["customer_id"]: c for c in _fixtures.get("customers", [])}
ORDERS: Dict[str, dict] = {o["order_id"]: o for o in _fixtures.get("orders", [])}
CONFIDENTIAL_INFO: Dict[str, dict] = {c["id"]: c for c in _fixtures.get("confidential_information", [])}
POLICY_CONSTANTS: Dict[str, Any] = _fixtures.get("policy_constants", {})

def get_customer(customer_id: str) -> Optional[dict]:
    """Retrieve a customer by ID."""
    return CUSTOMERS.get(customer_id)

def get_order(order_id: str) -> Optional[dict]:
    """Retrieve an order by ID."""
    return ORDERS.get(order_id)

def get_policy_constant(key: str) -> Any:
    """Retrieve a policy constant (e.g. manager_approval_threshold)."""
    return POLICY_CONSTANTS.get(key)
