"""
Integration schemas for API validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class IntegrationBase(BaseModel):
    """Base integration schema."""
    name: str = Field(..., min_length=1, max_length=100)
    integration_type: str = Field(..., min_length=1, max_length=50)
    api_base_url: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)


class IntegrationCreate(IntegrationBase):
    """Schema for creating an integration."""
    business_id: int
    api_key: Optional[str] = None
    api_secret: Optional[str] = None


class IntegrationUpdate(BaseModel):
    """Schema for updating an integration."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    integration_type: Optional[str] = None
    api_base_url: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class IntegrationResponse(IntegrationBase):
    """Schema for integration response."""
    id: int
    business_id: int
    is_active: bool
    is_connected: bool
    last_sync_at: Optional[datetime] = None
    last_error: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Don't expose sensitive fields
    class Config:
        from_attributes = True

