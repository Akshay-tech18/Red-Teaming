import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from app.models.base import TimestampedMixin

if TYPE_CHECKING:
    from app.models.run import AttackRun

class Finding(Base, TimestampedMixin):
    __tablename__ = "findings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attack_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("attack_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(50), nullable=False) # OutcomeLabel
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    rationale: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_event_ids: Mapped[Optional[dict]] = mapped_column(JSON, default=list, nullable=True)

    # Relationships
    attack_run: Mapped["AttackRun"] = relationship("AttackRun", back_populates="findings")
