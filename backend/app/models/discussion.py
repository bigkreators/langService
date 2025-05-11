# app/models/discussion.py
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..database import Base
from ..utils.uuid_utils import SqliteUUID

class DiscussionTopic(Base):
    __tablename__ = "discussion_topics"
    
    id = Column(SqliteUUID, primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    author_name = Column(String)
    author_email = Column(String)
    created_date = Column(DateTime, default=datetime.utcnow)
    
    replies = relationship("DiscussionReply", back_populates="topic")

class DiscussionReply(Base):
    __tablename__ = "discussion_replies"
    
    id = Column(SqliteUUID, primary_key=True, default=uuid.uuid4)
    topic_id = Column(SqliteUUID, ForeignKey("discussion_topics.id"))
    content = Column(Text, nullable=False)
    author_name = Column(String)
    created_date = Column(DateTime, default=datetime.utcnow)
    
    topic = relationship("DiscussionTopic", back_populates="replies")
