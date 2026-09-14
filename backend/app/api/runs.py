from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import copy
import uuid
from datetime import datetime, timezone

from app.core.db import get_db
from app.models.run import AttackRun
from app.models.attack import Attack
from app.models.agent import AgentVersion
from app.models.trace import TraceEvent
from app.schemas.run import RunStartRequest, AttackRunRead
from app.agents.shopassist.agent import LLMClient
from app.execution.state_machine import run_agent_loop, MaxTurnsReachedError
from app.tracing.collector import TraceCollector

router = APIRouter(tags=["Runs"])

@router.post("/attacks/{attack_id}/run", response_model=AttackRunRead, status_code=status.HTTP_201_CREATED)
async def run_attack(attack_id: str, run_req: RunStartRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch attack and agent version
    attack = await db.get(Attack, attack_id)
    if not attack:
        raise HTTPException(status_code=404, detail="Attack not found")
        
    agent_version = await db.get(AgentVersion, run_req.agent_version_id)
    if not agent_version:
        raise HTTPException(status_code=404, detail="AgentVersion not found")

    # 2. Setup run record
    db_run = AttackRun(
        id=str(uuid.uuid4()),
        attack_id=attack_id,
        agent_version_id=run_req.agent_version_id,
        status="RUNNING",
        started_at=datetime.now(timezone.utc)
    )
    db.add(db_run)
    await db.commit()
    
    # 3. Setup execution environment
    client = LLMClient()
    system_prompt = agent_version.system_prompt
    messages = [{"role": "system", "content": system_prompt}]
    
    payload = attack.prompt
    if isinstance(payload, str):
        payload = [payload]
        
    session_state = copy.deepcopy(attack.metadata_info.get("initial_session_state", {}))
    collector = TraceCollector(attack_run_id=db_run.id)
    
    final_text = ""
    build_mode = run_req.build
    
    # 4. Execute turns
    try:
        for turn_prompt in payload:
            collector.log_user_message(turn_prompt)
            messages.append({"role": "user", "content": turn_prompt})
            
            final_text, messages = await run_agent_loop(
                client=client, 
                messages=messages, 
                session_state=session_state, 
                max_turns=run_req.max_turns,
                collector=collector,
                build=build_mode
            )
            
            if final_text:
                collector.log_agent_message(final_text)
                
        db_run.status = "COMPLETED"
        db_run.final_response = final_text
        
        # Call real deterministic checks from the evaluation layer
        from app.evaluation.checks import deterministic_checks, most_severe
        
        # Convert ORM events to dicts as expected by checks.py
        event_dicts = []
        for e in collector.events:
            event_dicts.append({
                "type": e.type,
                "tool": e.tool,
                "arguments": e.arguments or {},
                "result": e.result or {}
            })
            
        findings = deterministic_checks(event_dicts)
        db_run.deterministic_label = most_severe(findings)

    except Exception as e:
        db_run.status = "ERROR"
        db_run.final_response = f"ERROR: {str(e)}"
        
    db_run.completed_at = datetime.now(timezone.utc)
    
    # 5. Save traces to DB
    for evt in collector.events:
        db_evt = TraceEvent(
            id=evt.id,
            attack_run_id=evt.attack_run_id,
            sequence=evt.sequence,
            type=evt.type,
            timestamp=evt.timestamp,
            role=evt.role,
            content=evt.content,
            tool=evt.tool,
            arguments=evt.arguments,
            result=evt.result,
            state_before=evt.state_before,
            state_after=evt.state_after,
            rule_id=evt.rule_id,
            severity=evt.severity
        )
        db.add(db_evt)
        
    await db.commit()
    await db.refresh(db_run)
    return db_run

@router.get("/runs/{run_id}", response_model=AttackRunRead)
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)):
    run = await db.get(AttackRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run
