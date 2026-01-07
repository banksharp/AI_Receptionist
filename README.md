# 🦷 AI Receptionist Platform

An intelligent virtual receptionist system for dental offices and other businesses. Deploy AI-powered phone agents that answer calls, respond to inquiries, and schedule appointments autonomously—no human intervention required.

![Dashboard Preview](https://via.placeholder.com/800x400/0f172a/14b8a6?text=AI+Receptionist+Dashboard)

## ✨ Features

### 🤖 AI Phone Agent
- Natural language conversation handling
- Speech-to-text and text-to-speech
- Context-aware responses
- Sentiment analysis

### 📅 Appointment Scheduling
- Collect patient/client information
- Book appointments without human help
- Handle cancellations and rescheduling

### 💬 Custom Prompts
- Configure responses for FAQs, services, hours, etc.
- Trigger-based prompt matching
- Priority-based response selection

### 🏢 Multi-Business Support
- Manage multiple locations
- Per-business configurations
- Individual phone numbers per location

### 🔌 Integration Ready
- Connect to scheduling software (Dentrix, Open Dental, etc.)
- Calendar sync (Google Calendar, Microsoft Bookings)
- Custom API integration support

## 🏗️ Architecture

```
ai_recep/
├── backend/              # Python FastAPI backend
│   ├── api/              # REST API endpoints
│   │   ├── businesses.py # Business CRUD
│   │   ├── prompts.py    # Prompt configuration
│   │   ├── calls.py      # Call history
│   │   ├── integrations.py
│   │   └── webhooks.py   # Twilio webhooks
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic validation
│   ├── services/         # Business logic
│   │   ├── telephony.py  # Twilio integration
│   │   └── ai_handler.py # OpenAI conversation
│   └── main.py           # FastAPI app
│
├── frontend/             # React + TypeScript dashboard
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   └── services/     # API client
│   └── ...
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API key
- Twilio account (for phone calls)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=sqlite+aiosqlite:///./ai_receptionist.db
SECRET_KEY=your-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
EOF

# Run the server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## 📞 Twilio Setup

1. Create a [Twilio account](https://www.twilio.com/)
2. Purchase a phone number with voice capabilities
3. Configure webhook URLs in Twilio Console:
   - **Voice webhook**: `https://your-domain.com/api/webhooks/twilio/voice`
   - **Status callback**: `https://your-domain.com/api/webhooks/twilio/status`

For local development, use [ngrok](https://ngrok.com/):
```bash
ngrok http 8000
```

## 🔑 API Endpoints

### Businesses
- `GET /api/businesses` - List all businesses
- `POST /api/businesses` - Create business
- `GET /api/businesses/{id}` - Get business details
- `PUT /api/businesses/{id}` - Update business
- `DELETE /api/businesses/{id}` - Delete business

### Prompts
- `GET /api/prompts` - List prompts (filter by business_id)
- `POST /api/prompts` - Create prompt
- `POST /api/prompts/templates/{business_id}` - Generate default prompts
- `GET /api/prompts/categories` - List available categories

### Calls
- `GET /api/calls` - List call history
- `GET /api/calls/stats/{business_id}` - Get call statistics

### Integrations
- `GET /api/integrations/available` - List supported integrations
- `POST /api/integrations` - Configure integration
- `POST /api/integrations/{id}/test` - Test connection

## 🎨 Dashboard Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Overview stats, recent calls, quick actions |
| **Businesses** | Manage business locations |
| **Prompts** | Configure AI response scripts |
| **Calls** | View call history with transcripts |
| **Integrations** | Connect scheduling software |
| **Settings** | API keys and global configuration |

## 🔌 Scheduling Software Integration

The platform is designed to integrate with popular scheduling systems:

| System | Type | Status |
|--------|------|--------|
| Dentrix | Dental | Ready for API |
| Open Dental | Dental | Ready for API |
| Eaglesoft | Dental | Ready for API |
| Google Calendar | General | OAuth Ready |
| Microsoft Bookings | General | OAuth Ready |
| Calendly | General | OAuth Ready |
| Custom API | Any | Configurable |

## 🛠️ Development

### Running Tests
```bash
cd backend
pytest
```

### Database Migrations
```bash
# Using Alembic
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## 📄 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `SECRET_KEY` | JWT signing key | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Yes |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number | Yes |

## 🚢 Deployment

### Docker (Recommended)
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Platforms
- **Railway** - One-click deploy
- **Render** - Easy Docker deployment
- **AWS/GCP/Azure** - Enterprise options

## 📋 Roadmap

- [ ] Real-time call monitoring dashboard
- [ ] Multi-language support
- [ ] Voice customization options
- [ ] Advanced analytics and reporting
- [ ] SMS/Text messaging support
- [ ] Appointment reminders
- [ ] Wait list management
- [ ] Insurance verification integration

## 📝 License

MIT License - See LICENSE file for details.

---

Built with ❤️ for modern dental and medical practices.
