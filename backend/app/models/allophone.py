# File: backend/app/models/allophone.py
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base

class Allophone(Base):
    __tablename__ = "allophones"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phoneme_id = Column(UUID(as_uuid=True), ForeignKey("phonemes.id"))
    symbol = Column(String)
    environment = Column(String)
    example = Column(String)
    description = Column(String)
    audio_file = Column(String)
    
    phoneme = relationship("Phoneme", back_populates="allophones")
