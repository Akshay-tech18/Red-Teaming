from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field

class AgentVersionBase(BaseModel):
    version_label: str
    system_prompt: str
    protected_tools: List[str] = Field(default_factory=list)
    tool_config: Optional[dict[str, Any]] = Field(default_factory=dict)
    description: Optional[str] = None

class AgentVersionCreate(AgentVersionBase):
    pass

class AgentVersionRead(AgentVersionBase):
    id: str
    agent_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AgentBase(BaseModel):
    name: str
    description: Optional[str] = None

class AgentCreate(AgentBase):
    pass

class AgentRead(AgentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
