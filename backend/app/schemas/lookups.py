"""Pydantic schemas for lookup entities (API response models)."""

from pydantic import BaseModel, ConfigDict


class _OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SectorRead(_OrmBase):
    id: int
    sid_id: int | None = None
    code: str | None = None
    name: str


class SectorBrief(_OrmBase):
    id: int
    name: str


class DomainRead(_OrmBase):
    id: int
    sid_id: int | None = None
    name: str
    sector_id: int | None = None
    sector: SectorBrief | None = None


class DomainBrief(_OrmBase):
    id: int
    name: str


class ProviderRead(_OrmBase):
    id: int
    sid_id: str | None = None
    name: str


class ProviderBrief(_OrmBase):
    id: int
    name: str


class ProgramSponsorRead(_OrmBase):
    id: int
    sid_id: int | None = None
    name: str


class ProgramSponsorBrief(_OrmBase):
    id: int
    name: str


class OccupationRead(_OrmBase):
    id: int
    name: str


class TagRead(_OrmBase):
    id: int
    name: str


class NosCodeRead(_OrmBase):
    id: int
    code: str


class QpCodeRead(_OrmBase):
    id: int
    code: str


class ProgramRead(_OrmBase):
    id: int
    sid_id: int | None = None
    name: str


class InitiativeRead(_OrmBase):
    id: int
    sid_id: int | None = None
    name: str


class ProductTypeRead(_OrmBase):
    id: int
    sid_id: int | None = None
    name: str


class SkillSetRead(_OrmBase):
    id: int
    name: str
