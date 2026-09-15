from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.db import get_db
from app.models.constraint import Constraint
from app.schemas.constraint import ConstraintRead

router = APIRouter(tags=["Constraints"])

@router.get("/constraints", response_model=List[ConstraintRead])
async def list_constraints(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Constraint))
    return result.scalars().all()
