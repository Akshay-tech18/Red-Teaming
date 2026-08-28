import uuid
from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from app.models.base import TimestampedMixin

if TYPE_CHECKING:
    from app.models.attack import Attack
    from app.models.run import AttackRun

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class RegressionTest(Base, TimestampedMixin):
    __tablename__ = "regression_tests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attack_id: Mapped[str] = mapped_column(String(100), ForeignKey("attacks.id", ondelete="CASCADE"), nullable=False)
    baseline_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("attack_runs.id", ondelete="CASCADE"), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    results: Mapped[List["RegressionResult"]] = relationship("RegressionResult", back_populates="regression_test", cascade="all, delete-orphan")

class RegressionResult(Base):
    __tablename__ = "regression_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    regression_test_id: Mapped[str] = mapped_column(String(36), ForeignKey("regression_tests.id", ondelete="CASCADE"), nullable=False)
    new_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("attack_runs.id", ondelete="CASCADE"), nullable=False)
    old_label: Mapped[str] = mapped_column(String(50), nullable=False) # OutcomeLabel
    new_label: Mapped[str] = mapped_column(String(50), nullable=False) # OutcomeLabel
    status_diff: Mapped[str] = mapped_column(String(30), nullable=False) # NO_CHANGE, REGRESSION, IMPROVEMENT
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    regression_test: Mapped["RegressionTest"] = relationship("RegressionTest", back_populates="results")
