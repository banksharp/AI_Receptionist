"""
Business model - represents a business using the AI Receptionist.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Business(Base):
    """Business profile model."""
    
    __tablename__ = "businesses"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Information
    name = Column(String(255), nullable=False)
    business_type = Column(String(100), default="dental")  # dental, medical, salon, etc.
    description = Column(Text, nullable=True)
    
    # Contact Information
    phone_number = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    
    # Address
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    zip_code = Column(String(20), nullable=True)
    
    # Business Hours (JSON format)
    # {"monday": {"open": "09:00", "close": "17:00"}, ...}
    business_hours = Column(JSON, default=dict)
    
    # Services Offered (JSON array)
    # ["Cleaning", "Fillings", "Root Canal", ...]
    services = Column(JSON, default=list)
    
    # AI Configuration
    ai_voice = Column(String(50), default="alloy")  # OpenAI voice options
    ai_personality = Column(Text, nullable=True)  # Custom personality prompt
    greeting_message = Column(Text, default="Thank you for calling. How may I help you today?")
    
    # Twilio Configuration
    twilio_phone_number = Column(String(20), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    prompts = relationship("Prompt", back_populates="business", cascade="all, delete-orphan")
    calls = relationship("Call", back_populates="business", cascade="all, delete-orphan")
    integrations = relationship("Integration", back_populates="business", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Business {self.name}>"

