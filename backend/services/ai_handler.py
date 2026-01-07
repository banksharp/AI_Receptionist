"""
AI Conversation Handler - manages the AI-powered conversations.
"""
from typing import Optional, Dict, Any, List
from openai import OpenAI

from config import settings


class AIConversationHandler:
    """Handles AI-powered conversations for the receptionist."""
    
    def __init__(self, business_context: Dict[str, Any] = None):
        """Initialize the AI handler with business context."""
        self.business_context = business_context or {}
        
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            self.client = None
        
        self.conversation_history: List[Dict[str, str]] = []
    
    def is_configured(self) -> bool:
        """Check if OpenAI is properly configured."""
        return self.client is not None
    
    def build_system_prompt(self) -> str:
        """Build the system prompt based on business context."""
        business = self.business_context
        
        base_prompt = f"""You are an AI receptionist for {business.get('name', 'our office')}.
Your role is to professionally and warmly assist callers with their needs.

BUSINESS INFORMATION:
- Name: {business.get('name', 'N/A')}
- Type: {business.get('business_type', 'dental office')}
- Phone: {business.get('phone_number', 'N/A')}
- Address: {business.get('address_line1', 'N/A')}, {business.get('city', '')}, {business.get('state', '')} {business.get('zip_code', '')}

BUSINESS HOURS:
{self._format_hours(business.get('business_hours', {}))}

SERVICES OFFERED:
{', '.join(business.get('services', ['General services']))}

PERSONALITY GUIDELINES:
{business.get('ai_personality', 'Be professional, friendly, and helpful. Speak clearly and concisely.')}

IMPORTANT RULES:
1. Always be polite and professional
2. Never make up information you don't have
3. If you can't help with something, offer to transfer to a human
4. For emergencies, advise calling 911 if life-threatening
5. Collect necessary information for appointments (name, phone, preferred date/time, reason)
6. Confirm information back to the caller before proceeding
7. Keep responses concise and natural for voice conversation

AVAILABLE ACTIONS:
- Schedule appointment (requires: name, phone, date, time, reason)
- Answer questions about services, hours, location
- Cancel or reschedule existing appointments
- Transfer to human staff
- Take a message
"""
        return base_prompt
    
    def _format_hours(self, hours: Dict) -> str:
        """Format business hours for the prompt."""
        if not hours:
            return "Monday-Friday: 9:00 AM - 5:00 PM"
        
        formatted = []
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        
        for day in days:
            if day in hours:
                day_hours = hours[day]
                if day_hours.get('closed'):
                    formatted.append(f"{day.capitalize()}: Closed")
                else:
                    formatted.append(f"{day.capitalize()}: {day_hours.get('open', '9:00')} - {day_hours.get('close', '17:00')}")
        
        return '\n'.join(formatted) if formatted else "Monday-Friday: 9:00 AM - 5:00 PM"
    
    def add_prompts_to_context(self, prompts: List[Dict[str, Any]]) -> None:
        """Add business prompts to the conversation context."""
        if not prompts:
            return
        
        prompt_context = "\n\nCUSTOM PROMPTS AND RESPONSES:\n"
        
        for prompt in prompts:
            triggers = prompt.get('trigger_phrases', [])
            if isinstance(triggers, str):
                import json
                try:
                    triggers = json.loads(triggers)
                except:
                    triggers = [triggers]
            
            prompt_context += f"""
When caller mentions: {', '.join(triggers)}
Category: {prompt.get('category', 'general')}
Response: {prompt.get('content', '')}
Instructions: {prompt.get('ai_instructions', 'Respond naturally')}
"""
            if prompt.get('requires_info_collection'):
                fields = prompt.get('fields_to_collect', [])
                if isinstance(fields, str):
                    import json
                    try:
                        fields = json.loads(fields)
                    except:
                        fields = []
                prompt_context += f"Collect: {', '.join(fields)}\n"
        
        # Update system prompt with custom prompts
        self.business_context['custom_prompts'] = prompt_context
    
    async def process_input(
        self,
        user_input: str,
        collected_info: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Process user input and generate a response."""
        if not self.client:
            return {
                "response": "I apologize, but I'm having technical difficulties. Please hold while I transfer you to our staff.",
                "action": "transfer",
                "error": "OpenAI not configured"
            }
        
        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_input
        })
        
        # Build messages for API
        messages = [
            {"role": "system", "content": self.build_system_prompt() + self.business_context.get('custom_prompts', '')}
        ]
        
        # Add context about collected information
        if collected_info:
            messages.append({
                "role": "system",
                "content": f"Information collected so far: {collected_info}"
            })
        
        # Add conversation history
        messages.extend(self.conversation_history)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=0.7,
                max_tokens=300,
                functions=[
                    {
                        "name": "schedule_appointment",
                        "description": "Schedule an appointment for the caller",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "patient_name": {"type": "string", "description": "Name of the patient"},
                                "phone_number": {"type": "string", "description": "Contact phone number"},
                                "preferred_date": {"type": "string", "description": "Preferred appointment date"},
                                "preferred_time": {"type": "string", "description": "Preferred appointment time"},
                                "reason": {"type": "string", "description": "Reason for the visit"}
                            },
                            "required": ["patient_name", "phone_number", "preferred_date", "preferred_time"]
                        }
                    },
                    {
                        "name": "transfer_call",
                        "description": "Transfer the call to a human staff member",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "reason": {"type": "string", "description": "Reason for transfer"}
                            }
                        }
                    },
                    {
                        "name": "end_call",
                        "description": "End the call with a closing message",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "summary": {"type": "string", "description": "Summary of what was accomplished"}
                            }
                        }
                    }
                ],
                function_call="auto"
            )
            
            message = response.choices[0].message
            
            # Check if a function was called
            if message.function_call:
                import json
                function_name = message.function_call.name
                function_args = json.loads(message.function_call.arguments)
                
                result = {
                    "response": message.content or self._get_action_response(function_name, function_args),
                    "action": function_name,
                    "action_data": function_args
                }
            else:
                result = {
                    "response": message.content,
                    "action": None,
                    "action_data": None
                }
            
            # Add assistant response to history
            self.conversation_history.append({
                "role": "assistant",
                "content": result["response"]
            })
            
            return result
            
        except Exception as e:
            return {
                "response": "I apologize, but I'm experiencing some issues. Let me transfer you to our staff.",
                "action": "transfer",
                "error": str(e)
            }
    
    def _get_action_response(self, action: str, data: Dict) -> str:
        """Generate a response for a specific action."""
        if action == "schedule_appointment":
            return f"I've scheduled your appointment for {data.get('preferred_date')} at {data.get('preferred_time')}. We'll see you then, {data.get('patient_name')}!"
        elif action == "transfer_call":
            return "I'll transfer you to one of our staff members now. Please hold."
        elif action == "end_call":
            return "Thank you for calling! Have a great day."
        return ""
    
    def analyze_sentiment(self, text: str) -> str:
        """Analyze the sentiment of caller's input."""
        if not self.client:
            return "neutral"
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Analyze the sentiment of this text. Respond with only one word: positive, neutral, or negative."},
                    {"role": "user", "content": text}
                ],
                max_tokens=10
            )
            
            sentiment = response.choices[0].message.content.strip().lower()
            if sentiment in ["positive", "neutral", "negative"]:
                return sentiment
            return "neutral"
        except:
            return "neutral"
    
    def summarize_call(self) -> str:
        """Generate a summary of the conversation."""
        if not self.client or not self.conversation_history:
            return "No conversation to summarize."
        
        try:
            conversation_text = "\n".join([
                f"{msg['role']}: {msg['content']}"
                for msg in self.conversation_history
            ])
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Summarize this phone conversation in 2-3 sentences. Focus on what the caller wanted and what was accomplished."},
                    {"role": "user", "content": conversation_text}
                ],
                max_tokens=150
            )
            
            return response.choices[0].message.content.strip()
        except:
            return "Unable to generate summary."

