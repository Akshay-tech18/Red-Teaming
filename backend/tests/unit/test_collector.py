import pytest
from app.tracing.collector import TraceCollector

def test_trace_collector():
    collector = TraceCollector(attack_run_id="run_123")
    
    # 1. Log user message
    collector.log_user_message("Hello")
    
    # 2. Log tool call with state before
    state_before = {"verifications": []}
    collector.log_tool_call("verify_order", {"order_id": "1"}, state_before)
    
    # Simulate state mutation during execution
    state_after = {"verifications": ["1"]}
    
    # 3. Log tool result with state after
    collector.log_tool_result("verify_order", {"success": True}, state_after)
    
    # 4. Log agent message
    collector.log_agent_message("Verified!")
    
    # 5. Log security event
    collector.log_security_event("C-001", "HIGH", "Blocked refund on unverified order")
    
    assert len(collector.events) == 5
    
    # Check sequences
    assert [e.sequence for e in collector.events] == [1, 2, 3, 4, 5]
    
    # Check deep copies: state_before should remain empty even if the parent state object was mutated
    tool_call_event = collector.events[1]
    assert tool_call_event.type == "TOOL_CALL"
    assert tool_call_event.state_before == {"verifications": []}
    
    tool_result_event = collector.events[2]
    assert tool_result_event.type == "TOOL_RESULT"
    assert tool_result_event.state_after == {"verifications": ["1"]}
    
    # Check security event mapping
    security_event = collector.events[4]
    assert security_event.type == "SECURITY_EVENT"
    assert security_event.rule_id == "C-001"
    assert security_event.severity == "HIGH"
