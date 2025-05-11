# Extended IPA Symbols Backend

This project provides a backend service for the Extended IPA Symbols application. The backend handles data storage, audio file serving, and manages extended phoneme data.

## Features

- RESTful API for phoneme data
- Extended IPA symbols support
- Audio file serving
- Proposal system for new symbols
- Discussion forum
- Database support (SQLite or PostgreSQL)

## Prerequisites

- Python 3.9+
- pip (Python package manager)
- Optional: Docker and Docker Compose for containerized deployment

## Quick Start

### Using the start script

The easiest way to get started is using the provided start script:

```bash
# Make the script executable
chmod +x start.sh

# Run the script
./start.sh
```

The script will:
1. Check for and create required directories
2. Set up a Python virtual environment
3. Install dependencies
4. Initialize the database
5. Start the FastAPI server

### Manual Setup

If you prefer to set up manually:

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Unix or MacOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Initialize the database
python -m backend.scripts.init_db

# Start the server
cd backend
uvicorn app.main:app --reload
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Project Structure

```
my_extended_ipa_symbols/
├── backend/                      # Python FastAPI server
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI application entry point
│   │   ├── models/               # Database models
│   │   ├── routers/              # API route handlers
│   │   ├── schemas/              # Pydantic models for validation
│   │   ├── services/             # Business logic
│   │   └── database.py           # Database connection
│   ├── audio_files/              # Storage for audio files
│   ├── scripts/                  # Utility scripts
│   ├── requirements.txt          # Dependencies
│   └── Dockerfile                # For containerization
└── docker-compose.yml            # For local development
```

## API Endpoints

### Language Endpoints
- GET `/api/languages` - List all languages
- GET `/api/languages/{lang_code}` - Get specific language details

### Phoneme Endpoints
- GET `/api/languages/{lang_code}/phonemes` - Get all phonemes for a language
- GET `/api/languages/{lang_code}/phonemes/{phoneme_id}` - Get specific phoneme
- GET `/api/languages/{lang_code}/phonemic` - Get phonetic view data
- GET `/api/languages/{lang_code}/extended-phonemes` - Get only extended IPA phonemes
- GET `/api/languages/{lang_code}/impossible-phonemes` - Get impossible phonemes
- GET `/api/phonemes/categories` - Get phoneme categories

### Audio Endpoints
- GET `/api/audio/{lang_code}/{filename}` - Serve audio file

### Additional Endpoints
If you've implemented the extended features:
- GET/POST `/api/proposals` - Symbol proposals system
- GET/POST `/api/discussions` - Discussion forum
- GET `/api/notifications` - Notification system

## Data Import

To import extended IPA data:

```bash
# Extract data from HTML
python -m backend.scripts.extract_extended_phonemes

# Import to database
python -m backend.scripts.import_extended_ipa
```

## Development

### Adding New Models

1. Create a new model file in `app/models/`
2. Create a corresponding schema file in `app/schemas/`
3. Create a router in `app/routers/`
4. Include the router in `app.main:app`

### Running Tests

```bash
# Run tests
pytest
```

## Deployment Options

### VPS/Cloud Service
- Deploy on AWS EC2, DigitalOcean Droplet, or similar
- Use Docker for containerization
- Set up a PostgreSQL database for production
- Configure Nginx as a reverse proxy

### Platform as a Service
- Deploy the backend on Heroku, Render, or Railway
- Use their PostgreSQL add-ons
- Store audio files on AWS S3 or similar storage service

### Serverless
- Convert backend to AWS Lambda functions with API Gateway
- Use a service like DynamoDB for data storage
- Store audio files in S3

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
