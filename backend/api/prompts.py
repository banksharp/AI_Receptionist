"""
Prompt management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import json

from database import get_db
from models.prompt import Prompt, PromptCategory
from schemas.prompt import PromptCreate, PromptUpdate, PromptResponse

router = APIRouter()


@router.get("/", response_model=List[PromptResponse])
async def list_prompts(
    business_id: int = None,
    category: str = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get all prompts, optionally filtered by business or category."""
    query = select(Prompt)
    
    if business_id:
        query = query.where(Prompt.business_id == business_id)
    if category:
        query = query.where(Prompt.category == category)
    
    query = query.order_by(Prompt.priority.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    prompts = result.scalars().all()
    
    # Convert to response dicts with parsed JSON fields
    response_list = []
    for prompt in prompts:
        prompt_dict = {
            "id": prompt.id,
            "business_id": prompt.business_id,
            "name": prompt.name,
            "category": prompt.category.value if hasattr(prompt.category, 'value') else prompt.category,
            "trigger_phrases": None,
            "content": prompt.content,
            "ai_instructions": prompt.ai_instructions,
            "requires_info_collection": prompt.requires_info_collection,
            "fields_to_collect": None,
            "priority": prompt.priority,
            "is_active": prompt.is_active,
            "created_at": prompt.created_at,
            "updated_at": prompt.updated_at,
        }
        
        # Parse JSON fields
        if prompt.trigger_phrases:
            try:
                prompt_dict["trigger_phrases"] = json.loads(prompt.trigger_phrases)
            except json.JSONDecodeError:
                prompt_dict["trigger_phrases"] = []
        if prompt.fields_to_collect:
            try:
                prompt_dict["fields_to_collect"] = json.loads(prompt.fields_to_collect)
            except json.JSONDecodeError:
                prompt_dict["fields_to_collect"] = []
        
        response_list.append(prompt_dict)
    
    return response_list


@router.get("/categories")
async def list_categories():
    """Get all available prompt categories."""
    return [{"value": c.value, "name": c.name} for c in PromptCategory]


@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific prompt by ID."""
    result = await db.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    # Convert to response dict with parsed JSON fields
    prompt_dict = {
        "id": prompt.id,
        "business_id": prompt.business_id,
        "name": prompt.name,
        "category": prompt.category.value if hasattr(prompt.category, 'value') else prompt.category,
        "trigger_phrases": None,
        "content": prompt.content,
        "ai_instructions": prompt.ai_instructions,
        "requires_info_collection": prompt.requires_info_collection,
        "fields_to_collect": None,
        "priority": prompt.priority,
        "is_active": prompt.is_active,
        "created_at": prompt.created_at,
        "updated_at": prompt.updated_at,
    }
    
    # Parse JSON fields
    if prompt.trigger_phrases:
        try:
            prompt_dict["trigger_phrases"] = json.loads(prompt.trigger_phrases)
        except json.JSONDecodeError:
            prompt_dict["trigger_phrases"] = []
    if prompt.fields_to_collect:
        try:
            prompt_dict["fields_to_collect"] = json.loads(prompt.fields_to_collect)
        except json.JSONDecodeError:
            prompt_dict["fields_to_collect"] = []
    
    return prompt_dict


@router.post("/", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    prompt_data: PromptCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new prompt."""
    data = prompt_data.model_dump()
    
    # Store original lists for response
    original_trigger_phrases = data.get("trigger_phrases")
    original_fields_to_collect = data.get("fields_to_collect")
    
    # Convert lists to JSON strings for storage (check for not None, not truthiness)
    if data.get("trigger_phrases") is not None:
        data["trigger_phrases"] = json.dumps(data["trigger_phrases"]) if data["trigger_phrases"] else None
    if data.get("fields_to_collect") is not None:
        data["fields_to_collect"] = json.dumps(data["fields_to_collect"]) if data["fields_to_collect"] else None
    
    prompt = Prompt(**data)
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)
    
    # Return response dict without modifying ORM object
    return {
        "id": prompt.id,
        "business_id": prompt.business_id,
        "name": prompt.name,
        "category": prompt.category.value if hasattr(prompt.category, 'value') else prompt.category,
        "trigger_phrases": original_trigger_phrases,
        "content": prompt.content,
        "ai_instructions": prompt.ai_instructions,
        "requires_info_collection": prompt.requires_info_collection,
        "fields_to_collect": original_fields_to_collect,
        "priority": prompt.priority,
        "is_active": prompt.is_active,
        "created_at": prompt.created_at,
        "updated_at": prompt.updated_at,
    }


@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: int,
    prompt_data: PromptUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a prompt."""
    result = await db.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    update_data = prompt_data.model_dump(exclude_unset=True)
    
    # Store original lists for response
    response_trigger_phrases = update_data.get("trigger_phrases")
    response_fields_to_collect = update_data.get("fields_to_collect")
    
    # Convert lists to JSON strings (check for key presence, convert empty arrays to None)
    if "trigger_phrases" in update_data:
        update_data["trigger_phrases"] = json.dumps(update_data["trigger_phrases"]) if update_data["trigger_phrases"] else None
    if "fields_to_collect" in update_data:
        update_data["fields_to_collect"] = json.dumps(update_data["fields_to_collect"]) if update_data["fields_to_collect"] else None
    
    for field, value in update_data.items():
        setattr(prompt, field, value)
    
    await db.commit()
    await db.refresh(prompt)
    
    # Parse stored JSON for response (for fields not in update)
    if response_trigger_phrases is None and prompt.trigger_phrases:
        try:
            response_trigger_phrases = json.loads(prompt.trigger_phrases)
        except json.JSONDecodeError:
            response_trigger_phrases = []
    if response_fields_to_collect is None and prompt.fields_to_collect:
        try:
            response_fields_to_collect = json.loads(prompt.fields_to_collect)
        except json.JSONDecodeError:
            response_fields_to_collect = []
    
    # Return response dict without modifying ORM object
    return {
        "id": prompt.id,
        "business_id": prompt.business_id,
        "name": prompt.name,
        "category": prompt.category.value if hasattr(prompt.category, 'value') else prompt.category,
        "trigger_phrases": response_trigger_phrases,
        "content": prompt.content,
        "ai_instructions": prompt.ai_instructions,
        "requires_info_collection": prompt.requires_info_collection,
        "fields_to_collect": response_fields_to_collect,
        "priority": prompt.priority,
        "is_active": prompt.is_active,
        "created_at": prompt.created_at,
        "updated_at": prompt.updated_at,
    }


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a prompt."""
    result = await db.execute(
        select(Prompt).where(Prompt.id == prompt_id)
    )
    prompt = result.scalar_one_or_none()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    await db.delete(prompt)
    await db.commit()


@router.post("/templates/{business_id}")
async def create_default_prompts(
    business_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Create default prompt templates for a business."""
    default_prompts = [
        {
            "name": "Appointment Scheduling",
            "category": PromptCategory.SCHEDULING,
            "trigger_phrases": json.dumps(["schedule", "appointment", "book", "visit", "see the doctor"]),
            "content": "I'd be happy to help you schedule an appointment. Let me get some information from you.",
            "ai_instructions": "Collect patient name, preferred date and time, reason for visit. Be friendly and professional.",
            "requires_info_collection": True,
            "fields_to_collect": json.dumps(["patient_name", "phone_number", "preferred_date", "preferred_time", "reason_for_visit"]),
            "priority": 10
        },
        {
            "name": "Business Hours",
            "category": PromptCategory.HOURS,
            "trigger_phrases": json.dumps(["hours", "open", "close", "when are you open"]),
            "content": "Our office hours are Monday through Friday, 9 AM to 5 PM. We are closed on weekends.",
            "ai_instructions": "Provide accurate hours from business profile. Mention if there are any special hours.",
            "priority": 5
        },
        {
            "name": "Location/Directions",
            "category": PromptCategory.LOCATION,
            "trigger_phrases": json.dumps(["location", "address", "where", "directions", "find you"]),
            "content": "We are located at [ADDRESS]. Would you like me to provide directions?",
            "ai_instructions": "Use the business address from profile. Offer to provide landmark references.",
            "priority": 5
        },
        {
            "name": "Emergency",
            "category": PromptCategory.EMERGENCY,
            "trigger_phrases": json.dumps(["emergency", "urgent", "pain", "bleeding", "broken tooth"]),
            "content": "I understand you may be experiencing a dental emergency. If this is a life-threatening emergency, please call 911 immediately. Otherwise, let me connect you with our emergency line.",
            "ai_instructions": "Take emergencies seriously. If life-threatening, direct to 911. Otherwise, transfer to emergency line or on-call doctor.",
            "priority": 20
        },
        {
            "name": "Insurance Questions",
            "category": PromptCategory.INSURANCE,
            "trigger_phrases": json.dumps(["insurance", "coverage", "accept", "payment", "cost"]),
            "content": "We accept most major dental insurance plans. For specific coverage questions, I can have our billing department contact you, or you can bring your insurance card to your appointment.",
            "ai_instructions": "Be helpful about insurance. If uncertain, offer to have billing follow up.",
            "priority": 5
        },
        {
            "name": "Cancel/Reschedule",
            "category": PromptCategory.CANCELLATION,
            "trigger_phrases": json.dumps(["cancel", "reschedule", "change appointment", "can't make it"]),
            "content": "I can help you with that. Let me look up your appointment. May I have your name and the date of your scheduled appointment?",
            "ai_instructions": "Collect patient name and appointment date. Process cancellation or offer alternative times for rescheduling.",
            "requires_info_collection": True,
            "fields_to_collect": json.dumps(["patient_name", "appointment_date", "new_preferred_date", "new_preferred_time"]),
            "priority": 8
        }
    ]
    
    created_prompts = []
    for prompt_data in default_prompts:
        prompt = Prompt(business_id=business_id, **prompt_data)
        db.add(prompt)
        created_prompts.append(prompt)
    
    await db.commit()
    
    return {"message": f"Created {len(created_prompts)} default prompts", "count": len(created_prompts)}

