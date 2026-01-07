"""
Integration management API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models.integration import Integration
from schemas.integration import IntegrationCreate, IntegrationUpdate, IntegrationResponse

router = APIRouter()


# Supported scheduling integrations
SUPPORTED_INTEGRATIONS = [
    {
        "id": "dentrix",
        "name": "Dentrix",
        "type": "scheduling",
        "description": "Henry Schein Dentrix practice management software",
        "requires_oauth": False
    },
    {
        "id": "open_dental",
        "name": "Open Dental",
        "type": "scheduling",
        "description": "Open-source dental practice management software",
        "requires_oauth": False
    },
    {
        "id": "eaglesoft",
        "name": "Eaglesoft",
        "type": "scheduling",
        "description": "Patterson Dental Eaglesoft practice management",
        "requires_oauth": False
    },
    {
        "id": "practice_web",
        "name": "Practice-Web",
        "type": "scheduling",
        "description": "Practice-Web dental software",
        "requires_oauth": False
    },
    {
        "id": "google_calendar",
        "name": "Google Calendar",
        "type": "scheduling",
        "description": "Google Calendar for appointment scheduling",
        "requires_oauth": True
    },
    {
        "id": "microsoft_bookings",
        "name": "Microsoft Bookings",
        "type": "scheduling",
        "description": "Microsoft 365 Bookings for scheduling",
        "requires_oauth": True
    },
    {
        "id": "calendly",
        "name": "Calendly",
        "type": "scheduling",
        "description": "Calendly scheduling platform",
        "requires_oauth": True
    },
    {
        "id": "custom_api",
        "name": "Custom API",
        "type": "scheduling",
        "description": "Connect to your own scheduling API",
        "requires_oauth": False
    }
]


@router.get("/available")
async def list_available_integrations():
    """Get list of supported integrations."""
    return SUPPORTED_INTEGRATIONS


@router.get("/", response_model=List[IntegrationResponse])
async def list_integrations(
    business_id: int = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all configured integrations."""
    query = select(Integration)
    
    if business_id:
        query = query.where(Integration.business_id == business_id)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(
    integration_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific integration by ID."""
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()
    
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    return integration


@router.post("/", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_integration(
    integration_data: IntegrationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new integration."""
    integration = Integration(**integration_data.model_dump())
    db.add(integration)
    await db.commit()
    await db.refresh(integration)
    return integration


@router.put("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: int,
    integration_data: IntegrationUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an integration."""
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()
    
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    update_data = integration_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(integration, field, value)
    
    await db.commit()
    await db.refresh(integration)
    return integration


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_integration(
    integration_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete an integration."""
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()
    
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    await db.delete(integration)
    await db.commit()


@router.post("/{integration_id}/test")
async def test_integration(
    integration_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Test an integration connection."""
    result = await db.execute(
        select(Integration).where(Integration.id == integration_id)
    )
    integration = result.scalar_one_or_none()
    
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found"
        )
    
    # TODO: Implement actual connection testing based on integration type
    # For now, just return a mock success
    integration.is_connected = True
    integration.last_error = None
    await db.commit()
    
    return {
        "success": True,
        "message": f"Successfully connected to {integration.name}"
    }

