# File: backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import languages, phonemes, audio
from .database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IPA Symbols API",
    description="API for Extended IPA Symbols and Phonemic Chart",
    version="1.0.0"
)

# Configure CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-production-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(languages.router, prefix="/api", tags=["languages"])
app.include_router(phonemes.router, prefix="/api", tags=["phonemes"])
app.include_router(audio.router, prefix="/api", tags=["audio"])

@app.get("/")
async def root():
    return {"message": "Welcome to the IPA Symbols API"}
