from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.llm import call

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)

@router.post("/")
async def chat_with_copilot(request: ChatRequest):
    context_str = "\n".join([f"- {k}: {v}" for k, v in request.context.items()])
    
    prompt = f"""You are an AI Co-Pilot for a Red-Teaming security dashboard. 
The user is currently viewing the following context in the application:
{context_str}

The user asked the following question:
{request.message}

Please provide a helpful, concise, and accurate response based on this context. 
If the question is about security rules, prompt injections, or tracing, use your knowledge of Red-Teaming and AI security to answer.
"""
    
    try:
        reply = call(prompt)
        return {"reply": reply}
    except Exception as e:
        return {"reply": f"Error calling LLM: {str(e)}"}
