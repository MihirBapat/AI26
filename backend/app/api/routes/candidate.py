"""Candidate profile API routes."""

import os
import time

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.candidate import CandidateProfile
from app.models.user import User
from app.schemas.candidate import CandidateProfileCreate, CandidateProfileResponse, CandidateProfileUpdate

router = APIRouter(prefix="/candidate", tags=["candidate"])


class SessionTokenResponse(BaseModel):
    token: str
    room_name: str
    livekit_url: str


@router.get("/profile", response_model=CandidateProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current candidate's profile."""
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can access this resource",
        )

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found",
        )
    return profile


@router.post("/profile", response_model=CandidateProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    profile_data: CandidateProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new candidate profile."""
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can create profiles",
        )

    # Check if profile already exists
    existing_profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists. Use PUT or PATCH to update.",
        )

    db_profile = CandidateProfile(**profile_data.model_dump(), user_id=current_user.id)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.put("/profile", response_model=CandidateProfileResponse)
def update_profile(
    profile_data: CandidateProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing candidate profile."""
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can access this resource",
        )

    db_profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not db_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found",
        )

    update_data = profile_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_profile, key, value)

    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.post("/session-token", response_model=SessionTokenResponse)
def create_session_token(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Issue a LiveKit room token for the candidate's AI consultation session."""
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can create consultation sessions",
        )

    # Ensure profile exists before starting a session
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complete your profile before starting a consultation",
        )

    from dotenv import load_dotenv
    load_dotenv(override=True)

    livekit_api_key = os.environ.get("LIVEKIT_API_KEY", "")
    livekit_api_secret = os.environ.get("LIVEKIT_API_SECRET", "")
    livekit_url = os.environ.get("LIVEKIT_URL", "")

    if not livekit_api_key or not livekit_api_secret or not livekit_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice consultation service not configured. Contact administrator.",
        )

    try:
        from livekit.api import AccessToken, VideoGrants
        from datetime import timedelta
        
        import uuid
        room_name = f"consultation-{current_user.id}-{uuid.uuid4().hex[:8]}"
        token = (
            AccessToken(livekit_api_key, livekit_api_secret)
            .with_identity(str(current_user.id))
            .with_name(profile.full_name or current_user.full_name or "Candidate")
            .with_grants(VideoGrants(room_join=True, room=room_name))
            .with_ttl(timedelta(hours=1))
            .to_jwt()
        )

        # Explicitly dispatch the agent
        import asyncio
        from livekit.api import LiveKitAPI, CreateAgentDispatchRequest
        
        async def dispatch_agent():
            async with LiveKitAPI(livekit_url, livekit_api_key, livekit_api_secret) as api:
                await api.agent_dispatch.create_dispatch(
                    CreateAgentDispatchRequest(agent_name="counselor", room=room_name)
                )

        try:
            asyncio.run(dispatch_agent())
        except Exception:
            pass

        return SessionTokenResponse(
            token=token,
            room_name=room_name,
            livekit_url=livekit_url,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate session token: {exc}",
        ) from exc
