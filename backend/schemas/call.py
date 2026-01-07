"""
Call schemas for API validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from datetime import datetime

# Define status as Literal type to avoid circular imports
CallStatusType = Literal[
    "in_progress", "completed", "transferred", 
    "voicemail", "missed", "failed"
]


class CallBase(BaseModel):
    """Base call schema."""
    caller_number: Optional[str] = None
    called_number: Optional[str] = None


class CallCreate(CallBase):
    """Schema for creating a call log."""
    business_id: int
    twilio_call_sid: Optional[str] = None


class CallUpdate(BaseModel):
    """Schema for updating a call."""
    status: Optional[CallStatusType] = None
    duration_seconds: Optional[int] = None
    transcript: Optional[str] = None
    call_summary: Optional[str] = None
    caller_intent: Optional[str] = None
    sentiment: Optional[str] = None
    collected_info: Optional[Dict[str, Any]] = None
    action_taken: Optional[str] = None
    action_details: Optional[Dict[str, Any]] = None
    recording_url: Optional[str] = None
    ended_at: Optional[datetime] = None


class CallResponse(CallBase):
    """Schema for call response."""
    id: int
    business_id: int
    twilio_call_sid: Optional[str] = None
    status: str  # Using str to avoid enum issues
    duration_seconds: int
    transcript: Optional[str] = None
    call_summary: Optional[str] = None
    caller_intent: Optional[str] = None
    sentiment: Optional[str] = None
    collected_info: Dict[str, Any] = Field(default_factory=dict)
    action_taken: Optional[str] = None
    action_details: Dict[str, Any] = Field(default_factory=dict)
    recording_url: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
