import json
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.tools.registry import TOOL_SCHEMAS

class LLMClient:
    def __init__(self):
        self.model = settings.LLM_MODEL
        self.groq_api_key = settings.GROQ_API_KEY
        self.gemini_api_key = settings.GEMINI_API_KEY
        
        # Determine provider based on model name
        if self.model.startswith("llama") or self.model.startswith("mixtral") or self.model.startswith("gemma") or self.model.startswith("openai/gpt-oss"):
            self.provider = "groq"
            self.base_url = "https://api.groq.com/openai/v1/chat/completions"
            self.api_key = self.groq_api_key
        else:
            self.provider = "gemini"
            # NOTE: Gemini also supports OpenAI compatible endpoints natively now,
            # but since LLM_MODEL in .env is llama-3.3-70b-versatile, we focus on Groq.
            self.base_url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
            self.api_key = self.gemini_api_key

    async def get_response(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Call the LLM with the given message history and available tools.
        Returns a dictionary with 'content' (str) and 'tool_calls' (list of dicts).
        """
        if self.provider == "groq":
            return await self._call_openai_compatible(self.base_url, messages)
        elif self.provider == "gemini":
            return await self._call_openai_compatible(self.base_url, messages)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

    async def _call_openai_compatible(self, url: str, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError(f"API key for provider '{self.provider}' is not set in environment.")
            
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "tools": TOOL_SCHEMAS,
            "tool_choice": "auto",
            "temperature": 0.0 # Deterministic for evaluation reliability
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code != 200:
                raise Exception(f"LLM API Error {response.status_code}: {response.text}")
                
            data = response.json()
            message = data["choices"][0]["message"]
            
            # Format the output to a standard schema
            result = {
                "content": message.get("content"),
                "tool_calls": []
            }
            
            if "tool_calls" in message and message["tool_calls"]:
                for tc in message["tool_calls"]:
                    result["tool_calls"].append({
                        "id": tc["id"],
                        "name": tc["function"]["name"],
                        "arguments": json.loads(tc["function"]["arguments"])
                    })
                    
            return result
