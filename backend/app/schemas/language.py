# File: backend/app/schemas/language.py
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class LanguageBase(BaseModel):
    code: str
    name: str

class LanguageCreate(LanguageBase):
    pass

class Language(LanguageBase):
    id: UUID
    
    class Config:
        orm_mode = True
