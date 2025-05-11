# app/models/phoneme.py
from sqlalchemy import Column, String, Integer, ForeignKey, Enum, Boolean, Text
from sqlalchemy.orm import relationship
import uuid
import enum
from ..database import Base
from ..utils.uuid_utils import SqliteUUID

class PhonemeType(enum.Enum):
    consonant = "consonant"
    vowel = "vowel"

class Phoneme(Base):
    __tablename__ = "phonemes"
    
    id = Column(SqliteUUID, primary_key=True, default=uuid.uuid4)
    language_id = Column(SqliteUUID, ForeignKey("languages.id"))
    type = Column(Enum(PhonemeType))
    symbol = Column(String)
    ipa = Column(String)
    example = Column(String)
    description = Column(String)
    audio_file = Column(String)
    row_position = Column(Integer)
    column_position = Column(Integer)
    
    # New fields for extended IPA
    is_extended = Column(Boolean, default=False)
    articulation_type = Column(String, nullable=True)  # e.g., "plosive", "fricative"
    articulation_place = Column(String, nullable=True)  # e.g., "bilabial", "velar"
    impossibility_reason = Column(String, nullable=True)  # For impossible phonemes
    
    language = relationship("Language", back_populates="phonemes")
    allophones = relationship("Allophone", back_populates="phoneme")
