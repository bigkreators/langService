# File: backend/app/models/notification.py
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from ..database import Base

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    related_entity_type = Column(String)  # e.g., "proposal", "discussion"
    related_entity_id = Column(UUID(as_uuid=True))
    is_read = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow)
