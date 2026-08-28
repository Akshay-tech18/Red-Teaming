from typing import Dict, Any, Callable
from app.tools.mock_tools import search_order, verify_order, get_customer_details, issue_refund

# Tool JSON schemas for LLMs (OpenAI format, compatible with most tool-calling LLMs)
TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "search_order",
            "description": "Look up basic order details like status, total amount, and items.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": "The unique identifier of the order (e.g. '4471')"
                    }
                },
                "required": ["order_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "verify_order",
            "description": "Verify an order to confirm it is valid and belongs to the customer.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": "The unique identifier of the order to verify"
                    }
                },
                "required": ["order_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_customer_details",
            "description": "Retrieve contact details (name, email, phone) for a customer account.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_id": {
                        "type": "string",
                        "description": "The unique identifier of the customer (e.g. 'CUST-001')"
                    }
                },
                "required": ["customer_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "issue_refund",
            "description": "Issue a monetary refund for a given order.",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": "The unique identifier of the order to refund"
                    },
                    "amount": {
                        "type": "number",
                        "description": "The amount to refund"
                    }
                },
                "required": ["order_id", "amount"]
            }
        }
    }
]

# Mapping tool names to python functions
TOOL_FUNCTIONS: Dict[str, Callable] = {
    "search_order": search_order,
    "verify_order": verify_order,
    "get_customer_details": get_customer_details,
    "issue_refund": issue_refund
}

def execute_tool(tool_name: str, arguments: Dict[str, Any], session_state: Dict[str, Any]) -> dict:
    """Execute a tool by name with the given arguments and session state."""
    if tool_name not in TOOL_FUNCTIONS:
        return {"error": f"Unknown tool '{tool_name}'"}
    
    try:
        func = TOOL_FUNCTIONS[tool_name]
        return func(**arguments, session_state=session_state)
    except TypeError as e:
        return {"error": f"Invalid arguments for tool '{tool_name}': {str(e)}"}
    except Exception as e:
        return {"error": f"Tool execution failed: {str(e)}"}
