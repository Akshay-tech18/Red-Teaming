from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from app.models.base import TimestampedMixin

if TYPE_CHECKING:
    from app.models.agent import Agent
    from app.models.attack import Attack

class Constraint(Base, TimestampedMixin):
    __tablename__ = "constraints"

    id: Mapped[str] = mapped_column(String(50), primary_key=True) # e.g. "C-001"
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    policy_id: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "P-001"
    description: Mapped[str] = mapped_column(Text, nullable=False)
    protected_action: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    required_condition: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    evaluation_type: Mapped[str] = mapped_column(String(20), nullable=False, default="HYBRID") # DETERMINISTIC, SEMANTIC, HYBRID
    mvp_status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE") # ACTIVE, STRETCH

    # Relationships
    agent: Mapped["Agent"] = relationship("Agent", back_populates="constraints")
    attacks: Mapped[List["Attack"]] = relationship("Attack", back_populates="constraint")
