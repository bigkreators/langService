from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from pathlib import Path

router = APIRouter()

# Define base directory for audio files
AUDIO_DIR = Path(__file__).resolve().parent.parent.parent / "audio_files"

@router.get("/audio/{lang_code}/{filename}")
async def get_audio(lang_code: str, filename: str):
    """
    Serve an audio file for a specific language.
    
    Parameters:
    - lang_code: Language code (e.g., 'english')
    - filename: Name of the audio file
    
    Returns:
    - Audio file as a streaming response
    """
    # Construct file path
    file_path = AUDIO_DIR / lang_code / filename
    
    # Check if file exists
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    # Return file
    return FileResponse(
        path=str(file_path),
        media_type="audio/mpeg",  # Assumes MP3, but will be overridden by content type detection
        filename=filename
    )

@router.get("/audio/proposals/{filename}")
async def get_proposal_audio(filename: str):
    """
    Serve an audio file for a proposal.
    
    Parameters:
    - filename: Name of the audio file
    
    Returns:
    - Audio file as a streaming response
    """
    # Construct file path
    file_path = AUDIO_DIR / "proposals" / filename
    
    # Check if file exists
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Proposal audio file not found")
    
    # Return file
    return FileResponse(
        path=str(file_path),
        media_type="audio/mpeg",  # Assumes MP3, but will be overridden by content type detection
        filename=filename
    )
