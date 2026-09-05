from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timezone
import uuid

from app.core.db import get_db
from app.models.regression import RegressionTest, RegressionResult
from app.models.run import AttackRun
from app.schemas.regression import RegressionTestCreate, RegressionTestRead, RegressionRerunRequest, RegressionResultRead

router = APIRouter(prefix="/regression-tests", tags=["Regression"])

@router.post("", response_model=RegressionTestRead, status_code=status.HTTP_201_CREATED)
async def create_regression_test(test_in: RegressionTestCreate, db: AsyncSession = Depends(get_db)):
    baseline_run = await db.get(AttackRun, test_in.baseline_run_id)
    if not baseline_run:
        raise HTTPException(status_code=404, detail="Baseline run not found")
        
    db_test = RegressionTest(
        attack_id=test_in.attack_id,
        baseline_run_id=test_in.baseline_run_id,
        active=test_in.active
    )
    db.add(db_test)
    await db.commit()
    await db.refresh(db_test)
    return db_test

@router.get("", response_model=List[RegressionTestRead])
async def list_regression_tests(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RegressionTest))
    return result.scalars().all()

@router.post("/{test_id}/rerun", response_model=RegressionResultRead)
async def rerun_regression_test(test_id: str, req: RegressionRerunRequest, db: AsyncSession = Depends(get_db)):
    test = await db.get(RegressionTest, test_id)
    if not test:
        raise HTTPException(status_code=404, detail="Regression test not found")
        
    baseline_run = await db.get(AttackRun, test.baseline_run_id)
    if not baseline_run:
        raise HTTPException(status_code=500, detail="Baseline run data is missing")
        
    new_run = await db.get(AttackRun, req.new_run_id)
    if not new_run:
        raise HTTPException(status_code=404, detail="New run not found")
        
    # Logic for comparing labels
    # Use evaluation_label if present, else fallback to deterministic_label, else SAFE
    old_label = baseline_run.evaluation_label or baseline_run.deterministic_label or "SAFE"
    new_label = new_run.evaluation_label or new_run.deterministic_label or "SAFE"
    
    # Severity list from low to high
    severities = ["SAFE", "ATTEMPT_BLOCKED", "PARTIAL_LEAK", "POLICY_VIOLATION", "CRITICAL_ACTION"]
    try:
        old_idx = severities.index(old_label)
        new_idx = severities.index(new_label)
    except ValueError:
        old_idx, new_idx = 0, 0
        
    if new_idx > old_idx:
        status_diff = "REGRESSION"
    elif new_idx < old_idx:
        status_diff = "IMPROVEMENT"
    else:
        status_diff = "NO_CHANGE"
        
    res = RegressionResult(
        regression_test_id=test_id,
        new_run_id=new_run.id,
        old_label=old_label,
        new_label=new_label,
        status_diff=status_diff
    )
    db.add(res)
    await db.commit()
    await db.refresh(res)
    return res
