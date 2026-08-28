import json
from typing import List, Dict, Any, Tuple, Optional
from app.agents.shopassist.agent import LLMClient
from app.tools.registry import execute_tool
from app.tracing.collector import TraceCollector

class MaxTurnsReachedError(Exception):
    """Raised when the agent loops too many times without returning a final text response."""
    pass

async def run_agent_loop(
    client: LLMClient,
    messages: List[Dict[str, Any]],
    session_state: Dict[str, Any],
    max_turns: int = 10,
    collector: Optional[TraceCollector] = None
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Executes the core conversational loop for the LLM.
    Handles calling the model, intercepting tool requests, executing them, 
    and feeding the results back to the model.
    
    Returns:
        Tuple containing the final string response and the complete message history.
    """
    turns = 0
    
    while turns < max_turns:
        turns += 1
        
        # 1. Call the LLM
        response = await client.get_response(messages)
        
        content = response.get("content")
        tool_calls = response.get("tool_calls", [])
        
        # 2. Reconstruct assistant message for the conversation history
        assistant_msg: Dict[str, Any] = {"role": "assistant"}
        if content:
            assistant_msg["content"] = content
            
        if tool_calls:
            # Must strictly match standard tool calling format
            assistant_msg["tool_calls"] = [
                {
                    "id": tc["id"],
                    "type": "function",
                    "function": {
                        "name": tc["name"],
                        "arguments": json.dumps(tc["arguments"])
                    }
                }
                for tc in tool_calls
            ]
            
        messages.append(assistant_msg)
        
        # 3. If no tools were called, the turn is over; return the final answer.
        if not tool_calls:
            return content or "", messages
            
        # 4. Process each tool call sequentially
        for tc in tool_calls:
            tool_name = tc["name"]
            arguments = tc["arguments"]
            
            if collector:
                collector.log_tool_call(tool_name, arguments, session_state)
            
            # NOTE: In Phase 5, we will inject Security Guards here before execution
            result = execute_tool(tool_name, arguments, session_state)
            
            if collector:
                collector.log_tool_result(tool_name, result, session_state)
            
            # Append tool result to the history so the LLM can read it on the next turn
            messages.append({
                "role": "tool",
                "tool_call_id": tc["id"],
                "name": tool_name,
                "content": json.dumps(result)
            })
            
    raise MaxTurnsReachedError(f"Agent exceeded maximum turns ({max_turns}) without completing the task.")
