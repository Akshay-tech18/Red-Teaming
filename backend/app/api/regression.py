from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.db import get_db
from app.models.regression import RegressionAlert
from app.models.run import AttackRun
from app.schemas.regression import RegressionAlertRead, RegressionAlertCreate

router = APIRouter(tags=["Regression"])

@router.post("/runs/{run_id}/regressions", response_model=RegressionAlertRead, status_code=status.HTTP_201_CREATED)
async def create_regression_alert(run_id: str, alert_in: RegressionAlertCreate, db: AsyncSession = Depends(get_db)):
    """Log a regression alert for a specific run."""
    run = await db.get(AttackRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    alert_dict = alert_in.model_dump()
    alert_dict["attack_run_id"] = run_id
    
    alert = RegressionAlert(**alert_dict)
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert

@router.get("/runs/{run_id}/regressions", response_model=List[RegressionAlertRead])
async def list_regressions_for_run(run_id: str, db: AsyncSession = Depends(get_db)):
    """List all regression alerts for a specific run."""
    run = await db.get(AttackRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    result = await db.execute(
        select(RegressionAlert).where(RegressionAlert.attack_run_id == run_id)
    )
    return result.scalars().all()
