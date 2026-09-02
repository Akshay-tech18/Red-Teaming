from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.db import get_db
from app.models.trace import TraceEvent
from app.schemas.trace import TraceEventRead

router = APIRouter(prefix="/runs", tags=["Traces"])

@router.get("/{run_id}/trace", response_model=List[TraceEventRead])
async def get_run_trace(run_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TraceEvent)
        .where(TraceEvent.attack_run_id == run_id)
        .order_by(TraceEvent.sequence.asc())
    )
    return result.scalars().all()
