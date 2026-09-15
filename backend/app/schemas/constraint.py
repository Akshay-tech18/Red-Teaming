from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel

class ConstraintRead(BaseModel):
    id: str
    agent_id: str
    policy_id: str
    description: str
    protected_action: Optional[str] = None
    required_condition: Optional[dict[str, Any]] = None
    severity: str
    evaluation_type: str
    mvp_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
