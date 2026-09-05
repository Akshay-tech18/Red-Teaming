from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class TraceEventBase(BaseModel):
    event_id: str
    type: str
    timestamp: datetime
    role: str
    content: Optional[str] = None
    tool: Optional[str] = None
    arguments: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    state_before: Optional[Dict[str, Any]] = None
    state_after: Optional[Dict[str, Any]] = None
    rule_id: Optional[str] = None
    severity: Optional[str] = None

class TraceEventRead(TraceEventBase):
    id: str
    attack_run_id: str

    class Config:
        from_attributes = True
