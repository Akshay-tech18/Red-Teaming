import uuid
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base
from app.models.base import TimestampedMixin

if TYPE_CHECKING:
    from app.models.constraint import Constraint
    from app.models.run import AttackRun

class Agent(Base, TimestampedMixin):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    versions: Mapped[List["AgentVersion"]] = relationship("AgentVersion", back_populates="agent", cascade="all, delete-orphan")
    constraints: Mapped[List["Constraint"]] = relationship("Constraint", back_populates="agent", cascade="all, delete-orphan")

class AgentVersion(Base, TimestampedMixin):
    __tablename__ = "agent_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    version_label: Mapped[str] = mapped_column(String(50), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    protected_tools: Mapped[dict] = mapped_column(JSON, default=list, nullable=False) # List of protected tool names
    tool_config: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    agent: Mapped["Agent"] = relationship("Agent", back_populates="versions")
    runs: Mapped[List["AttackRun"]] = relationship("AttackRun", back_populates="agent_version", cascade="all, delete-orphan")
