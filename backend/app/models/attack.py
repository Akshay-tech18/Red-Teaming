from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from app.models.base import TimestampedMixin

if TYPE_CHECKING:
    from app.models.constraint import Constraint
    from app.models.run import AttackRun

class Attack(Base, TimestampedMixin):
    __tablename__ = "attacks"

    id: Mapped[str] = mapped_column(String(100), primary_key=True) # e.g. "attack_001"
    constraint_id: Mapped[Optional[str]] = mapped_column(String(50), ForeignKey("constraints.id", ondelete="SET NULL"), nullable=True)
    target_policy: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "P-001"
    target_constraint: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Text description
    attack_family: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "AUTHORITY_IMPERSONATION"
    objective: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prompt: Mapped[dict] = mapped_column(JSON, nullable=False) # List of strings for multi-turn
    expected_label: Mapped[str] = mapped_column(String(50), nullable=False) # OutcomeLabel enum value
    rationale: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_info: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)

    # Relationships
    constraint: Mapped[Optional["Constraint"]] = relationship("Constraint", back_populates="attacks")
    runs: Mapped[List["AttackRun"]] = relationship("AttackRun", back_populates="attack", cascade="all, delete-orphan")
