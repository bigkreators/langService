from pydantic import BaseModel
from typing import List, Optional, Union
from uuid import UUID
from enum import Enum

class PhonemeType(str, Enum):
    consonant = "consonant"
    vowel = "vowel"

class AllophoneBase(BaseModel):
    symbol: str
    environment: str
    example: str
    description: str
    audio_file: Optional[str]

class AllophoneCreate(AllophoneBase):
    pass

class Allophone(AllophoneBase):
    id: UUID
    phoneme_id: UUID
    
    class Config:
        orm_mode = True

class PhonemeBase(BaseModel):
    symbol: str
    ipa: str
    example: str
    description: str
    type: PhonemeType
    row_position: int
    column_position: int
    audio_file: Optional[str]
    
    # Extended IPA fields
    is_extended: Optional[bool] = False
    articulation_type: Optional[str] = None
    articulation_place: Optional[str] = None
    impossibility_reason: Optional[str] = None

class PhonemeCreate(PhonemeBase):
    language_code: str

class Phoneme(PhonemeBase):
    id: UUID
    language_id: UUID
    allophones: List[Allophone] = []
    
    class Config:
        orm_mode = True

class PhonemeGrid(BaseModel):
    consonants: List[List[Optional[Phoneme]]]
    vowels: List[List[Optional[Phoneme]]]
    impossible: Optional[List[Phoneme]] = []
