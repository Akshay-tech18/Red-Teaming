import uuid
from typing import Optional
from sqlalchemy import String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base
from app.models.base import TimestampedMixin

class Tool(Base, TimestampedMixin):
    __tablename__ = "tools"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    input_schema: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    output_schema: Mapped[Optional[dict]] = mapped_column(JSON, default=dict, nullable=True)
