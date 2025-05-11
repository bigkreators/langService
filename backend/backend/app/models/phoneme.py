from sqlalchemy import Column, String, Integer, ForeignKey, Enum, Boolean, Text
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
    
    # New fields for extended IPA
    is_extended = Column(Boolean, default=False)
    articulation_type = Column(String, nullable=True)
    articulation_place = Column(String, nullable=True)
    impossibility_reason = Column(String, nullable=True)
    
    language = relationship("Language", back_populates="phonemes")
    allophones = relationship("Allophone", back_populates="phoneme")
