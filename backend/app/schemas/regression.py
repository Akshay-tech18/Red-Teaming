from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class RegressionEvidence(BaseModel):
    tool: Optional[str] = None
    call_count: Optional[int] = None
    successful_call_count: Optional[int] = None
    cumulative_amount: Optional[float] = None
    order_total: Optional[float] = None

class RegressionAlertBase(BaseModel):
    case_id: str
    build: str
    old_label: str
    new_label: str
    status_diff: str
    evidence: RegressionEvidence

class RegressionAlertCreate(RegressionAlertBase):
    pass

class RegressionAlertRead(RegressionAlertBase):
    id: str
    attack_run_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
