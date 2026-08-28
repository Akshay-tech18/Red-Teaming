import pytest
from typing import List, Dict, Any
from app.execution.state_machine import run_agent_loop, MaxTurnsReachedError

class MockLLMClient:
    def __init__(self, responses: List[Dict[str, Any]]):
        self.responses = responses
        self.call_count = 0
        
    async def get_response(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        if self.call_count >= len(self.responses):
            raise ValueError("Mock LLM ran out of programmed responses.")
        resp = self.responses[self.call_count]
        self.call_count += 1
        return resp

@pytest.mark.asyncio
async def test_state_machine_multi_turn():
    # Program the mock LLM to:
    # Turn 1: Ask to search an order
    # Turn 2: Output final text response
    mock_responses = [
        {
            "content": None,
            "tool_calls": [
                {
                    "id": "call_abc",
                    "name": "search_order",
                    "arguments": {"order_id": "4471"}
                }
            ]
        },
        {
            "content": "The order 4471 was found successfully.",
            "tool_calls": []
        }
    ]
    
    client = MockLLMClient(mock_responses)
    session_state = {}
    initial_messages = [{"role": "user", "content": "What is order 4471?"}]
    
    final_text, history = await run_agent_loop(client, initial_messages, session_state)
    
    assert final_text == "The order 4471 was found successfully."
    assert len(history) == 4
    # Check turn 1
    assert history[1]["role"] == "assistant"
    assert history[1]["tool_calls"][0]["function"]["name"] == "search_order"
    # Check tool result
    assert history[2]["role"] == "tool"
    assert history[2]["name"] == "search_order"
    assert "89.0" in history[2]["content"]  # Our mock data total_amount for 4471
    # Check final output
    assert history[3]["role"] == "assistant"
    assert history[3]["content"] == final_text

@pytest.mark.asyncio
async def test_state_machine_max_turns():
    # Program the mock LLM to infinitely loop calling tools
    mock_responses = [
        {
            "content": None,
            "tool_calls": [
                {
                    "id": "call_inf",
                    "name": "search_order",
                    "arguments": {"order_id": "4471"}
                }
            ]
        }
    ] * 5
    
    client = MockLLMClient(mock_responses)
    session_state = {}
    initial_messages = [{"role": "user", "content": "Find order"}]
    
    with pytest.raises(MaxTurnsReachedError):
        # Set max_turns=3, but LLM tries to turn 5 times
        await run_agent_loop(client, initial_messages, session_state, max_turns=3)
