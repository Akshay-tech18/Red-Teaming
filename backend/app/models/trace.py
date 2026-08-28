import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, JSON, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

if TYPE_CHECKING:
    from app.models.run import AttackRun

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class TraceEvent(Base):
    __tablename__ = "trace_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attack_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("attack_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False) # USER_MESSAGE, AGENT_MESSAGE, TOOL_CALL, TOOL_RESULT, SECURITY_EVENT
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False) # user, assistant, system, tool
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tool: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    arguments: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    state_before: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    state_after: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    rule_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    severity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Relationships
    attack_run: Mapped["AttackRun"] = relationship("AttackRun", back_populates="trace_events")
