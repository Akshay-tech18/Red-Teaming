from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class RegressionTestBase(BaseModel):
    attack_id: str
    baseline_run_id: str
    active: bool = True

class RegressionTestCreate(RegressionTestBase):
    pass

class RegressionTestRead(RegressionTestBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RegressionRerunRequest(BaseModel):
    agent_version_id: str

class RegressionResultRead(BaseModel):
    id: str
    regression_test_id: str
    new_run_id: str
    old_label: str
    new_label: str
    status_diff: str # NO_CHANGE, REGRESSION, IMPROVEMENT
    detected_at: datetime

    class Config:
        from_attributes = True
