import copy
from typing import List, Dict, Any
from datetime import datetime, timezone
import uuid
from app.models.trace import TraceEvent

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class TraceCollector:
    """
    Collects execution trace events in memory during an attack run.
    Deep-copies state snapshots to ensure historical accuracy of mutable dictionaries.
    """
    def __init__(self, attack_run_id: str):
        self.attack_run_id = attack_run_id
        self.events: List[TraceEvent] = []
        self._sequence = 0
        
    def _next_seq(self) -> int:
        self._sequence += 1
        return self._sequence
        
    def log_user_message(self, content: str) -> None:
        self.events.append(TraceEvent(
            id=str(uuid.uuid4()),
            attack_run_id=self.attack_run_id,
            sequence=self._next_seq(),
            type="USER_MESSAGE",
            timestamp=utc_now(),
            role="user",
            content=content
        ))
        
    def log_agent_message(self, content: str) -> None:
        self.events.append(TraceEvent(
            id=str(uuid.uuid4()),
            attack_run_id=self.attack_run_id,
            sequence=self._next_seq(),
            type="AGENT_MESSAGE",
            timestamp=utc_now(),
            role="assistant",
            content=content
        ))
        
    def log_tool_call(self, tool: str, arguments: Dict[str, Any], state_before: Dict[str, Any]) -> None:
        self.events.append(TraceEvent(
            id=str(uuid.uuid4()),
            attack_run_id=self.attack_run_id,
            sequence=self._next_seq(),
            type="TOOL_CALL",
            timestamp=utc_now(),
            role="assistant",
            tool=tool,
            arguments=copy.deepcopy(arguments),
            state_before=copy.deepcopy(state_before)
        ))
        
    def log_tool_result(self, tool: str, result: Dict[str, Any], state_after: Dict[str, Any]) -> None:
        self.events.append(TraceEvent(
            id=str(uuid.uuid4()),
            attack_run_id=self.attack_run_id,
            sequence=self._next_seq(),
            type="TOOL_RESULT",
            timestamp=utc_now(),
            role="tool",
            tool=tool,
            result=copy.deepcopy(result),
            state_after=copy.deepcopy(state_after)
        ))
        
    def log_security_event(self, rule_id: str, severity: str, content: str) -> None:
        self.events.append(TraceEvent(
            id=str(uuid.uuid4()),
            attack_run_id=self.attack_run_id,
            sequence=self._next_seq(),
            type="SECURITY_EVENT",
            timestamp=utc_now(),
            role="system",
            rule_id=rule_id,
            severity=severity,
            content=content
        ))
