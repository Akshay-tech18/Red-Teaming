import pytest
from app.tools.registry import execute_tool, TOOL_SCHEMAS

def test_tool_schemas():
    assert len(TOOL_SCHEMAS) == 4
    names = [schema["function"]["name"] for schema in TOOL_SCHEMAS]
    assert "search_order" in names
    assert "verify_order" in names
    assert "get_customer" in names
    assert "issue_refund" in names

def test_execute_tool_success():
    session_state = {}
    result = execute_tool("search_order", {"order_id": "ORD-1001"}, session_state)
    assert "error" not in result
    assert result["order_id"] == "ORD-1001"

def test_execute_tool_unknown():
    session_state = {}
    result = execute_tool("unknown_tool", {}, session_state)
    assert "error" in result
    assert "Unknown tool" in result["error"]

def test_execute_tool_invalid_args():
    session_state = {}
    # Missing required argument
    result = execute_tool("issue_refund", {"amount": 10.0}, session_state)
    assert "error" in result
    assert "Invalid arguments" in result["error"]
