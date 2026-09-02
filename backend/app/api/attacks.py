from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.db import get_db
from app.models.attack import Attack
from app.schemas.attack import AttackCreate, AttackRead

router = APIRouter(prefix="/attacks", tags=["Attacks"])

@router.post("", response_model=AttackRead, status_code=status.HTTP_201_CREATED)
async def create_attack(attack_in: AttackCreate, db: AsyncSession = Depends(get_db)):
    db_attack = Attack(
        id=attack_in.id,
        constraint_id=attack_in.constraint_id,
        target_policy=attack_in.target_policy,
        target_constraint=attack_in.target_constraint,
        attack_family=attack_in.attack_family,
        objective=attack_in.objective,
        prompt=attack_in.prompt,
        expected_label=attack_in.expected_label,
        rationale=attack_in.rationale,
        metadata_info=attack_in.metadata_info
    )
    db.add(db_attack)
    await db.commit()
    await db.refresh(db_attack)
    return db_attack

@router.get("", response_model=List[AttackRead])
async def list_attacks(constraint_id: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Attack)
    if constraint_id:
        query = query.where(Attack.constraint_id == constraint_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{attack_id}", response_model=AttackRead)
async def get_attack(attack_id: str, db: AsyncSession = Depends(get_db)):
    attack = await db.get(Attack, attack_id)
    if not attack:
        raise HTTPException(status_code=404, detail="Attack not found")
    return attack
