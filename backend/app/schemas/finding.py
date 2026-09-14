from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class FindingBase(BaseModel):
    case_id: str
    build: str
    evaluation_type: str
    
    n_runs: int = 1
    verdicts: List[str]
    verdict_counts: Dict[str, int]
    
    unanimous: bool
    has_majority: bool
    majority_verdict: str
    worst_observed: str
    
    judge_votes_per_verdict: Optional[int] = None
    judge_provider: Optional[str] = None
    judge_model: Optional[str] = None
    prompt_version: Optional[str] = None
    
    trace_refs: List[str]

class FindingCreate(FindingBase):
    pass

class FindingRead(FindingBase):
    id: str
    attack_run_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
