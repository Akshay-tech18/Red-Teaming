from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.llm import call

import hashlib

router = APIRouter()

# Simple in-memory cache to prevent LLM quota exhaustion during demo
RESPONSE_CACHE = {}
CACHE_MAX_SIZE = 100

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)

def _truncate_trace(trace_data: Any) -> Any:
    # If the context includes a full trace, compress it to save tokens
    if isinstance(trace_data, dict) and "events" in trace_data:
        events = trace_data["events"]
        # Keep only TOOL_CALL and TOOL_RESULT events to summarize execution
        truncated = [e for e in events if e.get("type") in ("TOOL_CALL", "TOOL_RESULT")]
        return {"events": truncated, "note": "Trace truncated for token limits"}
    return trace_data

@router.post("/")
async def chat_with_copilot(request: ChatRequest):
    # Truncate context if it's too large (like raw traces)
    clean_context = {k: _truncate_trace(v) for k, v in request.context.items()}
    context_str = "\n".join([f"- {k}: {v}" for k, v in clean_context.items()])
    
    prompt = f"""You are an AI Co-Pilot for a Red-Teaming security dashboard. 
The user is currently viewing the following context in the application:
{context_str}

The user asked the following question:
{request.message}

Please provide a helpful, concise, and accurate response based on this context. 
If the question is about security rules, prompt injections, or tracing, use your knowledge of Red-Teaming and AI security to answer.
"""
    
    # Generate cache key based on prompt
    cache_key = hashlib.md5(prompt.encode('utf-8')).hexdigest()
    if cache_key in RESPONSE_CACHE:
        return {"reply": RESPONSE_CACHE[cache_key], "cached": True}
        
    try:
        reply = call(prompt)
        
        # Enforce LRU size limit
        if len(RESPONSE_CACHE) > CACHE_MAX_SIZE:
            # Remove oldest
            RESPONSE_CACHE.pop(next(iter(RESPONSE_CACHE)))
            
        RESPONSE_CACHE[cache_key] = reply
        return {"reply": reply, "cached": False}
    except Exception as e:
        return {"reply": f"Error calling LLM: {str(e)}", "cached": False}
