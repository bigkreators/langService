from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from ..database import Base

class DiscussionTopic(Base):
    __tablename__ = "discussion_topics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    author_name = Column(String)
    author_email = Column(String)
    created_date = Column(DateTime, default=datetime.utcnow)
    
    replies = relationship("DiscussionReply", back_populates="topic")

class DiscussionReply(Base):
    __tablename__ = "discussion_replies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("discussion_topics.id"))
    content = Column(Text, nullable=False)
    author_name = Column(String)
    created_date = Column(DateTime, default=datetime.utcnow)
    
    topic = relationship("DiscussionTopic", back_populates="replies")
