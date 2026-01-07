"""
Prompt schemas for API validation.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal, Any
from datetime import datetime

# Define categories as Literal type to avoid circular imports
PromptCategoryType = Literal[
    "greeting", "scheduling", "faq", "services", "hours", 
    "location", "insurance", "emergency", "cancellation", 
    "callback", "transfer", "closing", "custom"
]


class PromptBase(BaseModel):
    """Base prompt schema."""
    name: str = Field(..., min_length=1, max_length=255)
    category: PromptCategoryType = "custom"
    trigger_phrases: Optional[List[str]] = None
    content: str = Field(..., min_length=1)
    ai_instructions: Optional[str] = None
    requires_info_collection: bool = False
    fields_to_collect: Optional[List[str]] = None
    priority: int = 0
    
    @field_validator('category', mode='before')
    @classmethod
    def convert_enum_to_string(cls, v: Any) -> str:
        """Convert enum to string value if needed."""
        if hasattr(v, 'value'):
            return v.value
        return v


class PromptCreate(PromptBase):
    """Schema for creating a prompt."""
    business_id: int


class PromptUpdate(BaseModel):
    """Schema for updating a prompt."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[PromptCategoryType] = None
    trigger_phrases: Optional[List[str]] = None
    content: Optional[str] = None
    ai_instructions: Optional[str] = None
    requires_info_collection: Optional[bool] = None
    fields_to_collect: Optional[List[str]] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class PromptResponse(PromptBase):
    """Schema for prompt response."""
    id: int
    business_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
