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
    
    # Core fields from spec
    case_id: Mapped[str] = mapped_column(String(50), nullable=False)
    build: Mapped[str] = mapped_column(String(50), nullable=False)
    evaluation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Distributions
    n_runs: Mapped[int] = mapped_column(nullable=False, default=1)
    verdicts: Mapped[list] = mapped_column(JSON, nullable=False)
    verdict_counts: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    # Summaries
    unanimous: Mapped[bool] = mapped_column(nullable=False)
    has_majority: Mapped[bool] = mapped_column(nullable=False)
    majority_verdict: Mapped[str] = mapped_column(String(50), nullable=False)
    worst_observed: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Judge provenance
    judge_votes_per_verdict: Mapped[Optional[int]] = mapped_column(nullable=True)
    judge_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    judge_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    prompt_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Trace tracking
    trace_refs: Mapped[list] = mapped_column(JSON, nullable=False)

    # Relationships
    attack_run: Mapped["AttackRun"] = relationship("AttackRun", back_populates="findings")
