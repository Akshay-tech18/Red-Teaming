from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.db import get_db
from app.models.finding import Finding
from app.models.run import AttackRun
from app.schemas.finding import FindingRead, FindingCreate

router = APIRouter(tags=["Findings"])

@router.post("/runs/{run_id}/findings", response_model=FindingRead, status_code=status.HTTP_201_CREATED)
async def create_finding_for_run(run_id: str, finding_in: FindingCreate, db: AsyncSession = Depends(get_db)):
    """Record an evaluation result (finding) for a specific run."""
    run = await db.get(AttackRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    finding_dict = finding_in.model_dump()
    finding_dict["attack_run_id"] = run_id
    
    finding = Finding(**finding_dict)
    db.add(finding)
    await db.commit()
    await db.refresh(finding)
    return finding

@router.get("/runs/{run_id}/findings", response_model=List[FindingRead])
async def list_findings_for_run(run_id: str, db: AsyncSession = Depends(get_db)):
    """List all evaluation results associated with a specific run."""
    run = await db.get(AttackRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
        
    result = await db.execute(
        select(Finding).where(Finding.attack_run_id == run_id)
    )
    return result.scalars().all()
