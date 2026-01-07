"""
Integration model - stores API connections to scheduling software.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Integration(Base):
    """External integration configuration model."""
    
    __tablename__ = "integrations"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Business relationship
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Integration Details
    name = Column(String(100), nullable=False)  # "Dentrix", "Open Dental", etc.
    integration_type = Column(String(50), nullable=False)  # scheduling, crm, billing
    
    # API Configuration
    api_base_url = Column(String(500), nullable=True)
    api_key = Column(Text, nullable=True)  # Should be encrypted in production
    api_secret = Column(Text, nullable=True)  # Should be encrypted in production
    
    # Additional configuration options
    config = Column(JSON, default=dict)
    
    # OAuth tokens (if applicable)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_connected = Column(Boolean, default=False)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business = relationship("Business", back_populates="integrations")
    
    def __repr__(self):
        return f"<Integration {self.name} ({self.integration_type})>"

