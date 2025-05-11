from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.notification import Notification as NotificationModel
from ..schemas.notification import Notification, NotificationCreate
import uuid
from datetime import datetime

router = APIRouter()

@router.get("/notifications", response_model=List[Notification])
def get_notifications(is_read: Optional[bool] = None, db: Session = Depends(get_db)):
    """
    Get all notifications with optional filter for read/unread
    """
    query = db.query(NotificationModel)
    
    if is_read is not None:
        query = query.filter(NotificationModel.is_read == is_read)
    
    return query.order_by(NotificationModel.created_date.desc()).all()

@router.post("/notifications", response_model=Notification)
def create_notification(notification: NotificationCreate, db: Session = Depends(get_db)):
    """
    Create a new notification
    """
    db_notification = NotificationModel(
        id=uuid.uuid4(),
        title=notification.title,
        message=notification.message,
        related_entity_type=notification.related_entity_type,
        related_entity_id=notification.related_entity_id,
        is_read=False,
        created_date=datetime.utcnow()
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

@router.put("/notifications/{notification_id}/read", response_model=Notification)
def mark_notification_read(notification_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Mark a notification as read
    """
    notification = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

@router.put("/notifications/read-all")
def mark_all_notifications_read(db: Session = Depends(get_db)):
    """
    Mark all notifications as read
    """
    db.query(NotificationModel).filter(NotificationModel.is_read == False).update(
        {"is_read": True}, synchronize_session=False
    )
    db.commit()
    
    return {"message": "All notifications marked as read"}

@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete a notification
    """
    notification = db.query(NotificationModel).filter(NotificationModel.id == notification_id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted successfully"}
