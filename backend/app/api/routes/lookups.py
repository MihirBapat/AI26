"""Lookup API routes — sectors, domains, providers, programs, etc."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.lookups import (
    Domain,
    Initiative,
    NosCode,
    Occupation,
    ProductType,
    Program,
    ProgramSponsor,
    Provider,
    QpCode,
    Sector,
    SkillSet,
    Tag,
)
from app.schemas.lookups import (
    DomainRead,
    InitiativeRead,
    NosCodeRead,
    OccupationRead,
    ProductTypeRead,
    ProgramRead,
    ProgramSponsorRead,
    ProviderRead,
    QpCodeRead,
    SectorRead,
    SkillSetRead,
    TagRead,
)

router = APIRouter(prefix="/lookups", tags=["lookups"])


@router.get("/sectors", response_model=list[SectorRead])
def list_sectors(db: Session = Depends(get_db)):
    """List all sectors, ordered by name."""
    rows = db.execute(select(Sector).order_by(Sector.name)).scalars().all()
    return [SectorRead.model_validate(r) for r in rows]


@router.get("/domains", response_model=list[DomainRead])
def list_domains(
    sector_id: int | None = Query(None, description="Filter by sector"),
    db: Session = Depends(get_db),
):
    """List domains, optionally filtered by sector."""
    q = select(Domain).order_by(Domain.name)
    if sector_id:
        q = q.where(Domain.sector_id == sector_id)
    rows = db.execute(q).scalars().all()
    return [DomainRead.model_validate(r) for r in rows]


@router.get("/providers", response_model=list[ProviderRead])
def list_providers(db: Session = Depends(get_db)):
    """List all learning providers."""
    rows = db.execute(select(Provider).order_by(Provider.name)).scalars().all()
    return [ProviderRead.model_validate(r) for r in rows]


@router.get("/program-sponsors", response_model=list[ProgramSponsorRead])
def list_program_sponsors(db: Session = Depends(get_db)):
    rows = db.execute(select(ProgramSponsor).order_by(ProgramSponsor.name)).scalars().all()
    return [ProgramSponsorRead.model_validate(r) for r in rows]


@router.get("/programs", response_model=list[ProgramRead])
def list_programs(db: Session = Depends(get_db)):
    rows = db.execute(select(Program).order_by(Program.name)).scalars().all()
    return [ProgramRead.model_validate(r) for r in rows]


@router.get("/initiatives", response_model=list[InitiativeRead])
def list_initiatives(db: Session = Depends(get_db)):
    rows = db.execute(select(Initiative).order_by(Initiative.name)).scalars().all()
    return [InitiativeRead.model_validate(r) for r in rows]


@router.get("/product-types", response_model=list[ProductTypeRead])
def list_product_types(db: Session = Depends(get_db)):
    rows = db.execute(select(ProductType).order_by(ProductType.name)).scalars().all()
    return [ProductTypeRead.model_validate(r) for r in rows]


@router.get("/occupations", response_model=list[OccupationRead])
def list_occupations(
    search: str | None = Query(None, description="Search by name"),
    limit: int = Query(50, le=500),
    db: Session = Depends(get_db),
):
    """List occupations (searchable, with limit)."""
    q = select(Occupation).order_by(Occupation.name)
    if search:
        q = q.where(Occupation.name.ilike(f"%{search}%"))
    q = q.limit(limit)
    rows = db.execute(q).scalars().all()
    return [OccupationRead.model_validate(r) for r in rows]


@router.get("/tags", response_model=list[TagRead])
def list_tags(
    search: str | None = Query(None),
    limit: int = Query(50, le=500),
    db: Session = Depends(get_db),
):
    q = select(Tag).order_by(Tag.name)
    if search:
        q = q.where(Tag.name.ilike(f"%{search}%"))
    q = q.limit(limit)
    rows = db.execute(q).scalars().all()
    return [TagRead.model_validate(r) for r in rows]


@router.get("/skill-sets", response_model=list[SkillSetRead])
def list_skill_sets(
    search: str | None = Query(None),
    limit: int = Query(50, le=500),
    db: Session = Depends(get_db),
):
    q = select(SkillSet).order_by(SkillSet.name)
    if search:
        q = q.where(SkillSet.name.ilike(f"%{search}%"))
    q = q.limit(limit)
    rows = db.execute(q).scalars().all()
    return [SkillSetRead.model_validate(r) for r in rows]


@router.get("/nos-codes", response_model=list[NosCodeRead])
def list_nos_codes(
    search: str | None = Query(None),
    limit: int = Query(50, le=500),
    db: Session = Depends(get_db),
):
    q = select(NosCode).order_by(NosCode.code)
    if search:
        q = q.where(NosCode.code.ilike(f"%{search}%"))
    q = q.limit(limit)
    rows = db.execute(q).scalars().all()
    return [NosCodeRead.model_validate(r) for r in rows]


@router.get("/qp-codes", response_model=list[QpCodeRead])
def list_qp_codes(
    search: str | None = Query(None),
    limit: int = Query(50, le=500),
    db: Session = Depends(get_db),
):
    q = select(QpCode).order_by(QpCode.code)
    if search:
        q = q.where(QpCode.code.ilike(f"%{search}%"))
    q = q.limit(limit)
    rows = db.execute(q).scalars().all()
    return [QpCodeRead.model_validate(r) for r in rows]
