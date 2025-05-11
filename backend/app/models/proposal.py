# File: backend/app/models/proposal.py
from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from ..database import Base

class Proposal(Base):
    __tablename__ = "proposals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String, nullable=False)
    sound_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    rationale = Column(Text, nullable=False)
    example_language = Column(String)
    audio_file = Column(String)
    image_file = Column(String)
    submitted_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")
    votes = Column(Integer, default=0)
