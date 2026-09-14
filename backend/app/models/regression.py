import uuid
from sqlalchemy import String, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from app.models.base import TimestampedMixin

class RegressionAlert(Base, TimestampedMixin):
    __tablename__ = "regression_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[str] = mapped_column(String(50), nullable=False)
    build: Mapped[str] = mapped_column(String(50), nullable=False)
    
    attack_run_id: Mapped[str] = mapped_column(String(36), ForeignKey("attack_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    old_label: Mapped[str] = mapped_column(String(50), nullable=False)
    new_label: Mapped[str] = mapped_column(String(50), nullable=False)
    status_diff: Mapped[str] = mapped_column(String(50), nullable=False) # BOUNDARY_CROSSING, ESCALATION
    
    # Regression Evidence Object (Section 3.4)
    evidence: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

