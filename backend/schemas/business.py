"""
Business schemas for API validation.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, List, Any
from datetime import datetime


class BusinessHours(BaseModel):
    """Business hours for a single day."""
    open: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    close: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    closed: bool = False


class BusinessBase(BaseModel):
    """Base business schema."""
    name: str = Field(..., min_length=1, max_length=255)
    business_type: str = Field(default="dental", max_length=100)
    description: Optional[str] = None
    
    # Contact
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    
    # Address
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    
    # Hours and services
    business_hours: Dict[str, Any] = Field(default_factory=dict)
    services: List[str] = Field(default_factory=list)
    
    # AI Configuration
    ai_voice: str = "alloy"
    ai_personality: Optional[str] = None
    greeting_message: str = "Thank you for calling. How may I help you today?"
    
    # Twilio
    twilio_phone_number: Optional[str] = None


class BusinessCreate(BusinessBase):
    """Schema for creating a business."""
    pass


class BusinessUpdate(BaseModel):
    """Schema for updating a business."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    business_type: Optional[str] = None
    description: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    services: Optional[List[str]] = None
    ai_voice: Optional[str] = None
    ai_personality: Optional[str] = None
    greeting_message: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    is_active: Optional[bool] = None


class BusinessResponse(BusinessBase):
    """Schema for business response."""
    id: int
    twilio_phone_number: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

