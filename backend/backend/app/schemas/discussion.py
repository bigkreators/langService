from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class ReplyBase(BaseModel):
    content: str
    author_name: Optional[str] = None

class ReplyCreate(ReplyBase):
    pass

class Reply(ReplyBase):
    id: UUID
    topic_id: UUID
    created_date: datetime
    
    class Config:
        orm_mode = True

class TopicBase(BaseModel):
    title: str
    content: str
    author_name: Optional[str] = None
    author_email: Optional[str] = None

class TopicCreate(TopicBase):
    pass

class Topic(TopicBase):
    id: UUID
    created_date: datetime
    replies: List[Reply] = []
    
    class Config:
        orm_mode = True
