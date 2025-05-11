from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.proposal import Proposal, ProposalCreate
from ..models.proposal import Proposal as ProposalModel
import uuid
from datetime import datetime
import os
import shutil

router = APIRouter()

@router.get("/proposals", response_model=List[Proposal])
def get_proposals(
    status: Optional[str] = None, 
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all proposals with optional filters for status and category
    """
    query = db.query(ProposalModel)
    
    if status:
        query = query.filter(ProposalModel.status == status)
    
    if category:
        query = query.filter(ProposalModel.category == category)
    
    return query.order_by(ProposalModel.submitted_date.desc()).all()

@router.get("/proposals/{proposal_id}", response_model=Proposal)
def get_proposal(proposal_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get a specific proposal by ID
    """
    proposal = db.query(ProposalModel).filter(ProposalModel.id == proposal_id).first()
    if proposal is None:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal

@router.post("/proposals", response_model=Proposal)
async def create_proposal(
    symbol: str = Form(...),
    sound_name: str = Form(...),
    category: str = Form(...),
    rationale: str = Form(...),
    example_language: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Create a new proposal with optional file uploads
    """
    # Create base proposal
    proposal = ProposalModel(
        id=uuid.uuid4(),
        symbol=symbol,
        sound_name=sound_name,
        category=category,
        rationale=rationale,
        example_language=example_language,
        submitted_date=datetime.utcnow(),
        status="pending",
        votes=0
    )
    
    # Handle audio file upload if provided
    if audio_file and audio_file.filename:
        audio_dir = os.path.join("audio", "proposals")
        os.makedirs(audio_dir, exist_ok=True)
        
        file_extension = os.path.splitext(audio_file.filename)[1]
        audio_filename = f"{proposal.id}{file_extension}"
        audio_path = os.path.join(audio_dir, audio_filename)
        
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)
        
        proposal.audio_file = f"proposals/{audio_filename}"
    
    # Handle image file upload if provided
    if image_file and image_file.filename:
        image_dir = os.path.join("images", "proposals")
        os.makedirs(image_dir, exist_ok=True)
        
        file_extension = os.path.splitext(image_file.filename)[1]
        image_filename = f"{proposal.id}{file_extension}"
        image_path = os.path.join(image_dir, image_filename)
        
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)
        
        proposal.image_file = f"proposals/{image_filename}"
    
    # Save proposal to database
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return proposal

@router.put("/proposals/{proposal_id}/vote", response_model=Proposal)
def vote_proposal(
    proposal_id: uuid.UUID, 
    vote: int, 
    db: Session = Depends(get_db)
):
    """
    Vote on a proposal (vote=1 for upvote, vote=-1 for downvote)
    """
    if vote not in [1, -1]:
        raise HTTPException(status_code=400, detail="Vote must be 1 or -1")
    
    proposal = db.query(ProposalModel).filter(ProposalModel.id == proposal_id).first()
    if proposal is None:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    proposal.votes += vote
    db.commit()
    db.refresh(proposal)
    return proposal

@router.put("/proposals/{proposal_id}/status", response_model=Proposal)
def update_proposal_status(
    proposal_id: uuid.UUID, 
    status: str, 
    db: Session = Depends(get_db)
):
    """
    Update the status of a proposal (admin only)
    """
    if status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be pending, approved, or rejected")
    
    proposal = db.query(ProposalModel).filter(ProposalModel.id == proposal_id).first()
    if proposal is None:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    proposal.status = status
    db.commit()
    db.refresh(proposal)
    return proposal

@router.delete("/proposals/{proposal_id}")
def delete_proposal(proposal_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete a proposal
    """
    proposal = db.query(ProposalModel).filter(ProposalModel.id == proposal_id).first()
    if proposal is None:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    # Remove associated files if they exist
    if proposal.audio_file:
        audio_path = os.path.join("audio", proposal.audio_file)
        if os.path.exists(audio_path):
            os.remove(audio_path)
    
    if proposal.image_file:
        image_path = os.path.join("images", proposal.image_file)
        if os.path.exists(image_path):
            os.remove(image_path)
    
    db.delete(proposal)
    db.commit()
    
    return {"message": "Proposal deleted successfully"}
