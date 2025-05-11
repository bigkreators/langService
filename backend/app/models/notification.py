# app/models/notification.py
from sqlalchemy import Column, String, Text, DateTime, Boolean
import uuid
from datetime import datetime
from ..database import Base
from ..utils.uuid_utils import SqliteUUID

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(SqliteUUID, primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    related_entity_type = Column(String)  # e.g., "proposal", "discussion"
    related_entity_id = Column(SqliteUUID)
    is_read = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow)
