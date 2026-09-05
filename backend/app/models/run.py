import uuid
from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from app.models.base import TimestampedMixin

if TYPE_CHECKING:
    from app.models.attack import Attack
    from app.models.agent import AgentVersion
    from app.models.trace import TraceEvent
    from app.models.finding import Finding

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class AttackRun(Base, TimestampedMixin):
    __tablename__ = "attack_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attack_id: Mapped[str] = mapped_column(String(100), ForeignKey("attacks.id", ondelete="CASCADE"), nullable=False)
    agent_version_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_versions.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="PENDING") # PENDING, RUNNING, COMPLETED, ERROR, TIMEOUT
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    final_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deterministic_label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # OutcomeLabel
    evaluation_label: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # OutcomeLabel (from Member 3 judge)
    initial_state: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
    deterministic_result: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)

    # Relationships
    attack: Mapped["Attack"] = relationship("Attack", back_populates="runs")
    agent_version: Mapped["AgentVersion"] = relationship("AgentVersion", back_populates="runs")
    trace_events: Mapped[List["TraceEvent"]] = relationship("TraceEvent", back_populates="attack_run", cascade="all, delete-orphan", order_by="TraceEvent.sequence")
    findings: Mapped[List["Finding"]] = relationship("Finding", back_populates="attack_run", cascade="all, delete-orphan")
