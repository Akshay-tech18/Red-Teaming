from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.db import get_db
from app.models.agent import Agent, AgentVersion
from app.schemas.agent import AgentVersionRead, AgentVersionCreate

router = APIRouter(tags=["Versions"])

@router.post("/agents/{agent_id}/versions", response_model=AgentVersionRead, status_code=status.HTTP_201_CREATED)
async def create_agent_version(agent_id: str, version_in: AgentVersionCreate, db: AsyncSession = Depends(get_db)):
    """Create a new version for an agent (e.g. vulnerable vs protected)."""
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    version_dict = version_in.model_dump()
    version_dict["agent_id"] = agent_id
    
    version = AgentVersion(**version_dict)
    db.add(version)
    await db.commit()
    await db.refresh(version)
    return version

@router.get("/agents/{agent_id}/versions", response_model=List[AgentVersionRead])
async def list_agent_versions(agent_id: str, db: AsyncSession = Depends(get_db)):
    """List all versions for a specific agent."""
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    result = await db.execute(
        select(AgentVersion).where(AgentVersion.agent_id == agent_id)
    )
    return result.scalars().all()

@router.get("/versions/{version_id}", response_model=AgentVersionRead)
async def get_version(version_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific agent version directly."""
    version = await db.get(AgentVersion, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version
