# app/models/language.py
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
import uuid
from ..database import Base
from ..utils.uuid_utils import SqliteUUID

class Language(Base):
    __tablename__ = "languages"
    
    id = Column(SqliteUUID, primary_key=True, default=uuid.uuid4)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    
    phonemes = relationship("Phoneme", back_populates="language")
