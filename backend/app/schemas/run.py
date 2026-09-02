from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from app.schemas.trace import TraceEventRead
from app.schemas.finding import FindingRead

class RunStartRequest(BaseModel):
    agent_version_id: str
    max_turns: int = 10
    build: str = "vulnerable"

class AttackRunBase(BaseModel):
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    final_response: Optional[str] = None
    deterministic_label: Optional[str] = None
    evaluation_label: Optional[str] = None

class AttackRunRead(AttackRunBase):
    id: str
    attack_id: str
    agent_version_id: str
    
    # Optionally include traces and findings when requested
    traces: Optional[List[TraceEventRead]] = None
    findings: Optional[List[FindingRead]] = None

    class Config:
        from_attributes = True
