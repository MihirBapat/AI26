"""API routes for Sector & District Curriculum Intelligence Reports."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.report import (
    SectorCurriculumReportResponse,
    SectorReportRequest,
)
from app.services.sector_report_service import sector_report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/sector-curriculum-intelligence", response_model=SectorCurriculumReportResponse)
async def generate_sector_report_post(
    payload: SectorReportRequest,
    db: Session = Depends(get_db),
):
    """Generate comprehensive Sector Curriculum Gap & New Courses Intelligence Report (POST)."""
    return await sector_report_service.generate_sector_report(
        db,
        sector_name=payload.sector_name,
        sector_id=payload.sector_id,
        district=payload.district,
    )


@router.get("/sector-curriculum-intelligence", response_model=SectorCurriculumReportResponse)
async def generate_sector_report_get(
    sector_name: str | None = Query(None, description="e.g. 'IT-ITeS', 'Automotive', 'Healthcare'"),
    sector_id: int | None = Query(None, description="Optional sector ID"),
    district: str | None = Query("All Maharashtra", description="e.g. 'Pune', 'Mumbai', 'All Maharashtra'"),
    db: Session = Depends(get_db),
):
    """Generate comprehensive Sector Curriculum Gap & New Courses Intelligence Report (GET)."""
    return await sector_report_service.generate_sector_report(
        db,
        sector_name=sector_name,
        sector_id=sector_id,
        district=district,
    )
