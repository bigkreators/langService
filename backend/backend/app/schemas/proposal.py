from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ProposalBase(BaseModel):
    symbol: str
    sound_name: str
    category: str
    rationale: str
    example_language: Optional[str] = None

class ProposalCreate(ProposalBase):
    pass

class Proposal(ProposalBase):
    id: UUID
    submitted_date: datetime
    status: str
    votes: int
    audio_file: Optional[str] = None
    image_file: Optional[str] = None
    
    class Config:
        orm_mode = True
