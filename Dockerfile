FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Create necessary directories
RUN mkdir -p audio/proposals images/proposals static/css static/js static/images

# Create a startup script that handles initialization
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Starting IPA Symbols Backend..."\n\
\n\
# Initialize database and import data\n\
python -c "\n\
import os\n\
import sys\n\
sys.path.append(\".\")\n\
\n\
try:\n\
    print(\"Setting up database...\")\n\
    from app.database import Base, engine, SessionLocal\n\
    from app.models.language import Language\n\
    from app.models.phoneme import Phoneme, PhonemeType\n\
    from app.models.allophone import Allophone\n\
    from app.models.proposal import Proposal\n\
    from app.models.discussion import DiscussionTopic, DiscussionReply\n\
    from app.models.notification import Notification\n\
    \n\
    print(\"Creating database tables...\")\n\
    Base.metadata.create_all(bind=engine)\n\
    print(\"Database tables created\")\n\
    \n\
    db = SessionLocal()\n\
    try:\n\
        language_count = db.query(Language).count()\n\
        if language_count == 0:\n\
            print(\"No languages found. Importing initial data...\")\n\
            from scripts.import_extended_ipa import import_extended_phonemes\n\
            import_extended_phonemes()\n\
            print(\"Extended phonemes imported\")\n\
        else:\n\
            print(f\"Database already contains {language_count} languages\")\n\
    finally:\n\
        db.close()\n\
    \n\
    print(\"Database setup completed!\")\n\
    \n\
except Exception as e:\n\
    print(f\"Setup error: {e}\")\n\
    import traceback\n\
    traceback.print_exc()\n\
    # Continue anyway - do not fail startup\n\
"\n\
\n\
echo "Starting FastAPI server..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 8000

# Start the application using our startup script
CMD ["/app/start.sh"]
