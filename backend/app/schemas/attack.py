from datetime import datetime
from typing import Optional, Any, Union, List, Dict
from pydantic import BaseModel, Field

class AttackBase(BaseModel):
    id: str
    constraint_id: Optional[str] = None
    target_policy: str
    target_constraint: Optional[str] = None
    attack_family: str
    objective: Optional[str] = None
    prompt: Union[str, List[Any]]
    expected_label: str
    rationale: Optional[str] = None
    metadata_info: Optional[Dict[str, Any]] = Field(default_factory=dict)

class AttackCreate(AttackBase):
    pass

class AttackRead(AttackBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
