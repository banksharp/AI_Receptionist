"""
Telephony service for handling voice calls via Twilio.
"""
from typing import Optional
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather

from config import settings


class TelephonyService:
    """Service for managing voice calls through Twilio."""
    
    def __init__(self):
        """Initialize Twilio client."""
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
        else:
            self.client = None
    
    def is_configured(self) -> bool:
        """Check if Twilio is properly configured."""
        return self.client is not None
    
    def create_greeting_response(
        self,
        greeting_message: str,
        voice: str = "Polly.Joanna"
    ) -> str:
        """Create initial greeting TwiML response."""
        response = VoiceResponse()
        
        # Gather speech input
        gather = Gather(
            input="speech",
            action="/api/webhooks/twilio/handle-input",
            method="POST",
            speechTimeout="auto",
            language="en-US"
        )
        
        gather.say(greeting_message, voice=voice)
        response.append(gather)
        
        # If no input, prompt again
        response.say("I didn't catch that. How may I help you?", voice=voice)
        response.redirect("/api/webhooks/twilio/voice")
        
        return str(response)
    
    def create_response(
        self,
        message: str,
        voice: str = "Polly.Joanna",
        gather_input: bool = True,
        end_call: bool = False
    ) -> str:
        """Create a TwiML response with the given message."""
        response = VoiceResponse()
        
        if end_call:
            response.say(message, voice=voice)
            response.hangup()
        elif gather_input:
            gather = Gather(
                input="speech",
                action="/api/webhooks/twilio/handle-input",
                method="POST",
                speechTimeout="auto",
                language="en-US"
            )
            gather.say(message, voice=voice)
            response.append(gather)
            
            # Timeout fallback
            response.say("Are you still there?", voice=voice)
            response.redirect("/api/webhooks/twilio/voice")
        else:
            response.say(message, voice=voice)
        
        return str(response)
    
    def transfer_call(
        self,
        phone_number: str,
        message: Optional[str] = None,
        voice: str = "Polly.Joanna"
    ) -> str:
        """Transfer the call to another number."""
        response = VoiceResponse()
        
        if message:
            response.say(message, voice=voice)
        
        response.dial(phone_number)
        
        return str(response)
    
    def send_to_voicemail(
        self,
        message: str,
        recording_callback: str,
        voice: str = "Polly.Joanna"
    ) -> str:
        """Send caller to voicemail."""
        response = VoiceResponse()
        
        response.say(message, voice=voice)
        response.record(
            action=recording_callback,
            method="POST",
            maxLength=120,
            transcribe=True
        )
        
        return str(response)
    
    async def get_call_details(self, call_sid: str) -> dict:
        """Get details of a call from Twilio."""
        if not self.client:
            return {}
        
        try:
            call = self.client.calls(call_sid).fetch()
            return {
                "sid": call.sid,
                "from": call.from_,
                "to": call.to,
                "status": call.status,
                "duration": call.duration,
                "direction": call.direction,
                "start_time": call.start_time,
                "end_time": call.end_time
            }
        except Exception as e:
            return {"error": str(e)}
    
    async def purchase_phone_number(
        self,
        area_code: Optional[str] = None
    ) -> Optional[str]:
        """Purchase a new phone number from Twilio."""
        if not self.client:
            return None
        
        try:
            # Search for available numbers
            if area_code:
                available = self.client.available_phone_numbers("US").local.list(
                    area_code=area_code,
                    limit=1
                )
            else:
                available = self.client.available_phone_numbers("US").local.list(
                    limit=1
                )
            
            if not available:
                return None
            
            # Purchase the number
            number = self.client.incoming_phone_numbers.create(
                phone_number=available[0].phone_number
            )
            
            return number.phone_number
            
        except Exception as e:
            print(f"Error purchasing phone number: {e}")
            return None

