from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

router = APIRouter()

AUDIO_DIR = "audio_files"

@router.get("/audio/{lang_code}/{filename}")
async def get_audio(lang_code: str, filename: str):
    file_path = os.path.join(AUDIO_DIR, lang_code, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(file_path)
