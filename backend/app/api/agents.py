from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.db import get_db
from app.models.agent import Agent, AgentVersion
from app.schemas.agent import AgentCreate, AgentRead, AgentVersionCreate, AgentVersionRead

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.post("", response_model=AgentRead, status_code=status.HTTP_201_CREATED)
async def create_agent(agent: AgentCreate, db: AsyncSession = Depends(get_db)):
    db_agent = Agent(name=agent.name, description=agent.description)
    db.add(db_agent)
    await db.commit()
    await db.refresh(db_agent)
    return db_agent

@router.get("", response_model=List[AgentRead])
async def list_agents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent))
    return result.scalars().all()

@router.get("/{agent_id}", response_model=AgentRead)
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.post("/{agent_id}/versions", response_model=AgentVersionRead, status_code=status.HTTP_201_CREATED)
async def create_agent_version(agent_id: str, version: AgentVersionCreate, db: AsyncSession = Depends(get_db)):
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    db_version = AgentVersion(
        agent_id=agent_id,
        version_label=version.version_label,
        system_prompt=version.system_prompt,
        protected_tools=version.protected_tools,
        tool_config=version.tool_config,
        description=version.description
    )
    db.add(db_version)
    await db.commit()
    await db.refresh(db_version)
    return db_version

@router.get("/{agent_id}/versions", response_model=List[AgentVersionRead])
async def list_agent_versions(agent_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgentVersion).where(AgentVersion.agent_id == agent_id))
    return result.scalars().all()
