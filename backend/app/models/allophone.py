# app/models/allophone.py
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from ..database import Base
from ..utils.uuid_utils import SqliteUUID

class Allophone(Base):
    __tablename__ = "allophones"
    
    id = Column(SqliteUUID, primary_key=True, default=uuid.uuid4)
    phoneme_id = Column(SqliteUUID, ForeignKey("phonemes.id"))
    symbol = Column(String)
    environment = Column(String)
    example = Column(String)
    description = Column(String)
    audio_file = Column(String)
    
    phoneme = relationship("Phoneme", back_populates="allophones")
