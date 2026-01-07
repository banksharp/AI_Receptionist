"""
Call model - tracks incoming calls and their outcomes.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class CallStatus(str, enum.Enum):
    """Status of a call."""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    TRANSFERRED = "transferred"
    VOICEMAIL = "voicemail"
    MISSED = "missed"
    FAILED = "failed"


class Call(Base):
    """Call log model."""
    
    __tablename__ = "calls"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Business relationship
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    
    # Twilio Call Details
    twilio_call_sid = Column(String(50), nullable=True, index=True)
    caller_number = Column(String(20), nullable=True)
    called_number = Column(String(20), nullable=True)
    
    # Call Metadata
    status = Column(Enum(CallStatus), default=CallStatus.IN_PROGRESS)
    duration_seconds = Column(Integer, default=0)
    
    # Conversation transcript
    transcript = Column(Text, nullable=True)
    
    # AI Analysis
    call_summary = Column(Text, nullable=True)
    caller_intent = Column(String(100), nullable=True)  # scheduling, question, complaint, etc.
    sentiment = Column(String(50), nullable=True)  # positive, neutral, negative
    
    # Collected Information (if any)
    collected_info = Column(JSON, default=dict)
    
    # Actions Taken
    action_taken = Column(String(255), nullable=True)  # appointment_scheduled, callback_requested, etc.
    action_details = Column(JSON, default=dict)
    
    # Recording URL (if enabled)
    recording_url = Column(String(500), nullable=True)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    business = relationship("Business", back_populates="calls")
    
    def __repr__(self):
        return f"<Call {self.twilio_call_sid} - {self.status}>"

