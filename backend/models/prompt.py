"""
Prompt model - configurable prompts/scripts for the AI receptionist.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class PromptCategory(str, enum.Enum):
    """Categories for prompts."""
    GREETING = "greeting"
    SCHEDULING = "scheduling"
    FAQ = "faq"
    SERVICES = "services"
    HOURS = "hours"
    LOCATION = "location"
    INSURANCE = "insurance"
    EMERGENCY = "emergency"
    CANCELLATION = "cancellation"
    CALLBACK = "callback"
    TRANSFER = "transfer"
    CLOSING = "closing"
    CUSTOM = "custom"


class Prompt(Base):
    """Prompt/script configuration model."""
    
    __tablename__ = "prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Business relationship
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Prompt Details
    name = Column(String(255), nullable=False)
    category = Column(Enum(PromptCategory), default=PromptCategory.CUSTOM)
    
    # Trigger phrases - what the caller might say to trigger this prompt
    # Stored as JSON array: ["schedule appointment", "book a visit", "make an appointment"]
    trigger_phrases = Column(Text, nullable=True)
    
    # The actual prompt/response content
    content = Column(Text, nullable=False)
    
    # Additional instructions for the AI
    ai_instructions = Column(Text, nullable=True)
    
    # Whether this prompt requires collecting information
    requires_info_collection = Column(Boolean, default=False)
    
    # Fields to collect if requires_info_collection is True
    # JSON: ["name", "phone", "preferred_date", "preferred_time", "reason"]
    fields_to_collect = Column(Text, nullable=True)
    
    # Priority (higher priority prompts are matched first)
    priority = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    business = relationship("Business", back_populates="prompts")
    
    def __repr__(self):
        return f"<Prompt {self.name} ({self.category})>"

