# File: backend/app/models/phoneme.py
from sqlalchemy import Column, String, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from ..database import Base

class PhonemeType(enum.Enum):
    consonant = "consonant"
    vowel = "vowel"

class Phoneme(Base):
    __tablename__ = "phonemes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_id = Column(UUID(as_uuid=True), ForeignKey("languages.id"))
    type = Column(Enum(PhonemeType))
    symbol = Column(String)
    ipa = Column(String)
    example = Column(String)
    description = Column(String)
    audio_file = Column(String)
    row_position = Column(Integer)
    column_position = Column(Integer)
    
    language = relationship("Language", back_populates="phonemes")
    allophones = relationship("Allophone", back_populates="phoneme")
