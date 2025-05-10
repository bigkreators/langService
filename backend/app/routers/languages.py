# File: backend/app/routers/languages.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.language import Language
from ..models.language import Language as LanguageModel

router = APIRouter()

@router.get("/languages", response_model=List[Language])
def get_languages(db: Session = Depends(get_db)):
    return db.query(LanguageModel).all()

@router.get("/languages/{lang_code}", response_model=Language)
def get_language(lang_code: str, db: Session = Depends(get_db)):
    language = db.query(LanguageModel).filter(LanguageModel.code == lang_code).first()
    if language is None:
        raise HTTPException(status_code=404, detail="Language not found")
    return language
