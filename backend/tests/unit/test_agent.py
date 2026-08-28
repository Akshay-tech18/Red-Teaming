import pytest
from unittest.mock import patch, AsyncMock
from app.agents.shopassist.agent import LLMClient

@pytest.mark.asyncio
async def test_llm_client_mocked():
    client = LLMClient()
    
    mock_response_data = {
        "choices": [
            {
                "message": {
                    "content": "Let me check that order for you.",
                    "tool_calls": [
                        {
                            "id": "call_123",
                            "type": "function",
                            "function": {
                                "name": "search_order",
                                "arguments": '{"order_id": "4471"}'
                            }
                        }
                    ]
                }
            }
        ]
    }
    
    class MockResponse:
        def __init__(self, json_data, status_code=200):
            self._json_data = json_data
            self.status_code = status_code
            self.text = ""
            
        def json(self):
            return self._json_data

    with patch('httpx.AsyncClient.post', new_callable=AsyncMock) as mock_post:
        mock_post.return_value = MockResponse(mock_response_data)
        
        # We need to temporarily set an API key so validation doesn't fail
        client.api_key = "fake_key"
        
        result = await client.get_response([{"role": "user", "content": "Check order 4471"}])
        
        assert result["content"] == "Let me check that order for you."
        assert len(result["tool_calls"]) == 1
        assert result["tool_calls"][0]["name"] == "search_order"
        assert result["tool_calls"][0]["arguments"]["order_id"] == "4471"
