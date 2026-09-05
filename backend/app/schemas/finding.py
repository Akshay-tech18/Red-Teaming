from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class FindingBase(BaseModel):
    label: str
    confidence: Optional[float] = None
    rationale: Optional[str] = None
    evidence_event_ids: Optional[List[str]] = None

class FindingCreate(FindingBase):
    pass

class FindingRead(FindingBase):
    id: str
    attack_run_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
