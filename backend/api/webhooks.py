"""
Webhook endpoints for Twilio and other external services.
"""
from fastapi import APIRouter, Request, Form, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from database import get_db
from models.business import Business
from models.call import Call
from models.call import CallStatus as CallStatusEnum
from models.prompt import Prompt
from services.telephony import TelephonyService
from services.ai_handler import AIConversationHandler

router = APIRouter()

# Store active conversations (in production, use Redis or similar)
active_conversations: dict = {}


@router.post("/twilio/voice")
async def handle_incoming_call(
    request: Request,
    CallSid: str = Form(...),
    From: str = Form(default=None),
    To: str = Form(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Handle incoming voice call from Twilio."""
    
    # Find the business by the called phone number
    result = await db.execute(
        select(Business).where(Business.twilio_phone_number == To)
    )
    business = result.scalar_one_or_none()
    
    if not business:
        # Default response if no business found
        telephony = TelephonyService()
        return Response(
            content=telephony.create_response(
                "We're sorry, but this number is not configured. Please try again later.",
                end_call=True
            ),
            media_type="application/xml"
        )
    
    # Create call record
    call = Call(
        business_id=business.id,
        twilio_call_sid=CallSid,
        caller_number=From,
        called_number=To,
        status=CallStatusEnum.IN_PROGRESS
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)
    
    # Initialize AI handler for this conversation
    ai_handler = AIConversationHandler(business_context={
        "name": business.name,
        "business_type": business.business_type,
        "phone_number": business.phone_number,
        "address_line1": business.address_line1,
        "city": business.city,
        "state": business.state,
        "zip_code": business.zip_code,
        "business_hours": business.business_hours,
        "services": business.services,
        "ai_personality": business.ai_personality
    })
    
    # Load business prompts
    prompt_result = await db.execute(
        select(Prompt).where(
            Prompt.business_id == business.id,
            Prompt.is_active == True
        ).order_by(Prompt.priority.desc())
    )
    prompts = prompt_result.scalars().all()
    
    prompt_data = [
        {
            "category": p.category.value if hasattr(p.category, 'value') else p.category,
            "trigger_phrases": p.trigger_phrases,
            "content": p.content,
            "ai_instructions": p.ai_instructions,
            "requires_info_collection": p.requires_info_collection,
            "fields_to_collect": p.fields_to_collect
        }
        for p in prompts
    ]
    ai_handler.add_prompts_to_context(prompt_data)
    
    # Store conversation state
    active_conversations[CallSid] = {
        "ai_handler": ai_handler,
        "call_id": call.id,
        "business_id": business.id,
        "collected_info": {},
        "transcript": []
    }
    
    # Generate greeting response
    telephony = TelephonyService()
    
    # Map AI voices to Twilio Polly voices (ai_voice is for OpenAI, Polly is for Twilio)
    polly_voice_map = {
        'alloy': 'Polly.Joanna',
        'echo': 'Polly.Matthew', 
        'fable': 'Polly.Amy',
        'onyx': 'Polly.Brian',
        'nova': 'Polly.Salli',
        'shimmer': 'Polly.Kimberly'
    }
    voice = polly_voice_map.get(business.ai_voice, 'Polly.Joanna')
    
    return Response(
        content=telephony.create_greeting_response(
            business.greeting_message,
            voice=voice
        ),
        media_type="application/xml"
    )


@router.post("/twilio/handle-input")
async def handle_speech_input(
    request: Request,
    CallSid: str = Form(...),
    SpeechResult: str = Form(default=None),
    db: AsyncSession = Depends(get_db)
):
    """Handle speech input from caller."""
    
    conversation = active_conversations.get(CallSid)
    
    if not conversation or not SpeechResult:
        telephony = TelephonyService()
        return Response(
            content=telephony.create_response(
                "I'm sorry, I didn't catch that. Could you please repeat?",
                gather_input=True
            ),
            media_type="application/xml"
        )
    
    ai_handler: AIConversationHandler = conversation["ai_handler"]
    
    # Add to transcript
    conversation["transcript"].append(f"Caller: {SpeechResult}")
    
    # Process with AI
    response = await ai_handler.process_input(
        SpeechResult,
        conversation["collected_info"]
    )
    
    # Add AI response to transcript
    conversation["transcript"].append(f"AI: {response['response']}")
    
    # Handle actions
    telephony = TelephonyService()
    
    if response.get("action") == "schedule_appointment":
        # Update collected info
        if response.get("action_data"):
            conversation["collected_info"].update(response["action_data"])
        
        # Update call record
        result = await db.execute(
            select(Call).where(Call.id == conversation["call_id"])
        )
        call = result.scalar_one_or_none()
        if call:
            call.collected_info = conversation["collected_info"]
            call.action_taken = "appointment_scheduled"
            call.action_details = response.get("action_data", {})
            await db.commit()
        
        return Response(
            content=telephony.create_response(
                response["response"],
                end_call=True
            ),
            media_type="application/xml"
        )
    
    elif response.get("action") == "transfer_call":
        # Get business for transfer number
        result = await db.execute(
            select(Business).where(Business.id == conversation["business_id"])
        )
        business = result.scalar_one_or_none()
        
        if business and business.phone_number:
            return Response(
                content=telephony.transfer_call(
                    business.phone_number,
                    response["response"]
                ),
                media_type="application/xml"
            )
    
    elif response.get("action") == "end_call":
        return Response(
            content=telephony.create_response(
                response["response"],
                end_call=True
            ),
            media_type="application/xml"
        )
    
    # Continue conversation
    return Response(
        content=telephony.create_response(
            response["response"],
            gather_input=True
        ),
        media_type="application/xml"
    )


@router.post("/twilio/status")
async def handle_call_status(
    request: Request,
    CallSid: str = Form(...),
    TwilioCallStatus: str = Form(..., alias="CallStatus"),
    CallDuration: Optional[int] = Form(default=0),
    db: AsyncSession = Depends(get_db)
):
    """Handle call status updates from Twilio."""
    
    conversation = active_conversations.get(CallSid)
    
    if conversation:
        # Update call record
        result = await db.execute(
            select(Call).where(Call.id == conversation["call_id"])
        )
        call = result.scalar_one_or_none()
        
        if call:
            # Map Twilio status to our status
            status_map = {
                "completed": CallStatusEnum.COMPLETED,
                "busy": CallStatusEnum.MISSED,
                "no-answer": CallStatusEnum.MISSED,
                "canceled": CallStatusEnum.MISSED,
                "failed": CallStatusEnum.FAILED
            }
            
            call.status = status_map.get(TwilioCallStatus.lower(), CallStatusEnum.COMPLETED)
            call.duration_seconds = CallDuration or 0
            call.transcript = "\n".join(conversation.get("transcript", []))
            
            # Generate call summary
            ai_handler: AIConversationHandler = conversation["ai_handler"]
            call.call_summary = ai_handler.summarize_call()
            
            # Analyze sentiment from transcript
            if call.transcript:
                caller_messages = [
                    line.replace("Caller: ", "") 
                    for line in conversation.get("transcript", []) 
                    if line.startswith("Caller:")
                ]
                if caller_messages:
                    call.sentiment = ai_handler.analyze_sentiment(" ".join(caller_messages))
            
            await db.commit()
        
        # Clean up conversation state
        del active_conversations[CallSid]
    
    return {"status": "ok"}

