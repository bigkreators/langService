from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.discussion import DiscussionTopic, DiscussionReply
from ..schemas.discussion import Topic, TopicCreate, Reply, ReplyCreate
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/discussions", response_model=List[Topic])
def get_discussions(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Get all discussion topics with pagination
    """
    topics = db.query(DiscussionTopic).order_by(
        DiscussionTopic.created_date.desc()
    ).offset(skip).limit(limit).all()
    
    return topics

@router.post("/discussions", response_model=Topic)
def create_discussion(topic: TopicCreate, db: Session = Depends(get_db)):
    """
    Create a new discussion topic
    """
    db_topic = DiscussionTopic(
        id=uuid.uuid4(),
        title=topic.title,
        content=topic.content,
        author_name=topic.author_name,
        author_email=topic.author_email,
        created_date=datetime.utcnow()
    )
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

@router.get("/discussions/{topic_id}", response_model=Topic)
def get_discussion(topic_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get a specific discussion topic with all replies
    """
    topic = db.query(DiscussionTopic).filter(DiscussionTopic.id == topic_id).first()
    if topic is None:
        raise HTTPException(status_code=404, detail="Discussion topic not found")
    return topic

@router.post("/discussions/{topic_id}/replies", response_model=Reply)
def add_reply(topic_id: uuid.UUID, reply: ReplyCreate, db: Session = Depends(get_db)):
    """
    Add a reply to a discussion topic
    """
    # Verify the topic exists
    topic = db.query(DiscussionTopic).filter(DiscussionTopic.id == topic_id).first()
    if topic is None:
        raise HTTPException(status_code=404, detail="Discussion topic not found")
    
    # Create the reply
    db_reply = DiscussionReply(
        id=uuid.uuid4(),
        topic_id=topic_id,
        content=reply.content,
        author_name=reply.author_name,
        created_date=datetime.utcnow()
    )
    db.add(db_reply)
    db.commit()
    db.refresh(db_reply)
    return db_reply

@router.delete("/discussions/{topic_id}")
def delete_discussion(topic_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete a discussion topic and all its replies
    """
    # Delete all replies first
    db.query(DiscussionReply).filter(DiscussionReply.topic_id == topic_id).delete()
    
    # Delete the topic
    topic = db.query(DiscussionTopic).filter(DiscussionTopic.id == topic_id).first()
    if topic is None:
        raise HTTPException(status_code=404, detail="Discussion topic not found")
    
    db.delete(topic)
    db.commit()
    
    return {"message": "Discussion topic deleted successfully"}

@router.delete("/discussions/{topic_id}/replies/{reply_id}")
def delete_reply(topic_id: uuid.UUID, reply_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete a specific reply
    """
    reply = db.query(DiscussionReply).filter(
        DiscussionReply.id == reply_id,
        DiscussionReply.topic_id == topic_id
    ).first()
    
    if reply is None:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    db.delete(reply)
    db.commit()
    
    return {"message": "Reply deleted successfully"}
