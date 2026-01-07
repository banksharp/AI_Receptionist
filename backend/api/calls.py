"""
Call management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from datetime import datetime

from database import get_db
from models.call import Call, CallStatus
from schemas.call import CallCreate, CallUpdate, CallResponse

router = APIRouter()


@router.get("/", response_model=List[CallResponse])
async def list_calls(
    business_id: int = None,
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all calls, optionally filtered by business or status."""
    query = select(Call)
    
    if business_id:
        query = query.where(Call.business_id == business_id)
    if status:
        query = query.where(Call.status == status)
    
    query = query.order_by(desc(Call.started_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/stats/{business_id}")
async def get_call_stats(
    business_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get call statistics for a business."""
    result = await db.execute(
        select(Call).where(Call.business_id == business_id)
    )
    calls = result.scalars().all()
    
    total_calls = len(calls)
    completed_calls = len([c for c in calls if c.status == CallStatus.COMPLETED])
    transferred_calls = len([c for c in calls if c.status == CallStatus.TRANSFERRED])
    
    # Calculate average duration
    durations = [c.duration_seconds for c in calls if c.duration_seconds > 0]
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    # Count by intent
    intents = {}
    for call in calls:
        if call.caller_intent:
            intents[call.caller_intent] = intents.get(call.caller_intent, 0) + 1
    
    return {
        "total_calls": total_calls,
        "completed_calls": completed_calls,
        "transferred_calls": transferred_calls,
        "average_duration_seconds": round(avg_duration, 1),
        "calls_by_intent": intents
    }


@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific call by ID."""
    result = await db.execute(
        select(Call).where(Call.id == call_id)
    )
    call = result.scalar_one_or_none()
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    return call


@router.post("/", response_model=CallResponse, status_code=status.HTTP_201_CREATED)
async def create_call(
    call_data: CallCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new call record."""
    call = Call(**call_data.model_dump())
    db.add(call)
    await db.commit()
    await db.refresh(call)
    return call


@router.put("/{call_id}", response_model=CallResponse)
async def update_call(
    call_id: int,
    call_data: CallUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a call record."""
    result = await db.execute(
        select(Call).where(Call.id == call_id)
    )
    call = result.scalar_one_or_none()
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    update_data = call_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(call, field, value)
    
    await db.commit()
    await db.refresh(call)
    return call


@router.post("/{call_id}/end")
async def end_call(
    call_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Mark a call as ended and calculate duration."""
    result = await db.execute(
        select(Call).where(Call.id == call_id)
    )
    call = result.scalar_one_or_none()
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    call.ended_at = datetime.utcnow()
    call.status = CallStatus.COMPLETED
    
    # Calculate duration
    if call.started_at:
        duration = (call.ended_at - call.started_at).total_seconds()
        call.duration_seconds = int(duration)
    
    await db.commit()
    await db.refresh(call)
    
    return {"message": "Call ended", "duration_seconds": call.duration_seconds}

