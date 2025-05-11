from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: UUID
    is_read: bool
    created_date: datetime
    
    class Config:
        orm_mode = True
