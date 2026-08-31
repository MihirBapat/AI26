"""Data Ingestion Provenance and Execution Tracking Model."""

from datetime import datetime
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base_model import TimestampMixin


class IngestionRun(TimestampMixin, Base):
    """Execution log for external data ingestion pipelines."""

    __tablename__ = "ingestion_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True, comment="'ADZUNA', 'EXCEL_COURSES', 'NCS', 'OTHER'"
    )
    status: Mapped[str] = mapped_column(
        String(50), default="running", nullable=False, comment="'running', 'completed', 'failed'"
    )
    records_fetched: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    records_inserted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    records_updated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    records_skipped: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    records_failed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    error_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<IngestionRun(id={self.id}, source='{self.source}', status='{self.status}', inserted={self.records_inserted})>"

