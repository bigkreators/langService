# Extended IPA Backend Implementation Plan

## 1. Project Structure

Based on the existing langService, we'll extend the structure to support the additional IPA features:

```
my_extended_ipa_symbols/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application entry point
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── language.py          # Language model (existing)
│   │   │   ├── phoneme.py           # Extended phoneme model
│   │   │   ├── allophone.py         # Allophone model (existing)
│   │   │   ├── proposal.py          # New model for symbol proposals
│   │   │   ├── discussion.py        # New model for forum discussions
│   │   │   └── notification.py      # New model for notifications
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── languages.py         # Language routes (existing)
│   │   │   ├── phonemes.py          # Enhanced phoneme routes
│   │   │   ├── audio.py             # Audio file routes (existing)
│   │   │   ├── proposals.py         # New routes for proposals
│   │   │   ├── discussions.py       # New routes for forum
│   │   │   └── notifications.py     # New routes for notifications
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── language.py          # Language schemas (existing)
│   │   │   ├── phoneme.py           # Enhanced phoneme schemas
│   │   │   ├── proposal.py          # New schemas for proposals
│   │   │   ├── discussion.py        # New schemas for discussions
│   │   │   └── notification.py      # New schemas for notifications
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── audio_service.py     # Audio processing (existing)
│   │   │   ├── proposal_service.py  # Proposal processing logic
│   │   │   └── notification_service.py  # Notification handling
│   │   └── database.py              # Database connection (existing)
│   ├── audio_files/                 # Storage for audio files (existing)
│   │   ├── english/
│   │   ├── spanish/
│   │   └── ...
│   ├── scripts/
│   │   ├── import_data.py           # Existing data import script
│   │   └── import_extended_ipa.py   # New script for extended IPA data
│   ├── requirements.txt             # Dependencies (updated)
│   └── Dockerfile                   # For containerization (existing)
├── frontend/                        # React frontend with extended components
└── docker-compose.yml               # For local development (existing)
```

## 2. Database Schema Extensions

We'll add new tables and extend existing ones to support all new features:

1. Extended `phonemes` table with additional fields:
   - `is_extended` (Boolean)
   - `articulation_type` (String)
   - `articulation_place` (String)
   - `impossibility_reason` (String)

2. New `proposals` table:
   - Primary key ID
   - Symbol information (symbol, name, category)
   - Rationale and examples
   - Status tracking (pending/approved/rejected)
   - Voting mechanism
   - Timestamps

3. New `discussion_topics` and `discussion_replies` tables:
   - Forum thread structure
   - Author information
   - Content and timestamps

4. New `notifications` table:
   - Notification messages
   - Read/unread status
   - Related entity references
   - Timestamps

## 3. API Endpoints

### Extended Phoneme Endpoints

```
# Enhanced phoneme endpoints
GET /api/languages/{lang_code}/phonemes?extended=true      - Get all phonemes including extended ones
GET /api/languages/{lang_code}/extended-phonemes           - Get only extended IPA phonemes
GET /api/languages/{lang_code}/impossible-phonemes         - Get impossible phonemes
GET /api/phonemes/categories                               - Get phoneme categories and articulation types
```

### Proposal System Endpoints

```
# Proposal system endpoints
GET /api/proposals                   - List all proposals (with filters)
POST /api/proposals                  - Create a new proposal
GET /api/proposals/{id}              - Get a specific proposal
PUT /api/proposals/{id}/vote         - Vote on a proposal (upvote/downvote)
PUT /api/proposals/{id}/status       - Update proposal status (admin)
DELETE /api/proposals/{id}           - Delete a proposal
POST /api/proposals/{id}/audio       - Upload audio for a proposal
POST /api/proposals/{id}/image       - Upload image for a proposal
```

### Discussion Forum Endpoints

```
# Discussion forum endpoints
GET /api/discussions                 - List all discussion topics (with pagination)
POST /api/discussions                - Create a new discussion topic
GET /api/discussions/{id}            - Get a specific discussion with replies
POST /api/discussions/{id}/replies   - Add a reply to a discussion
```

### Notification Endpoints

```
# Notification endpoints
GET /api/notifications               - Get user notifications
PUT /api/notifications/{id}/read     - Mark notification as read
DELETE /api/notifications/{id}       - Delete a notification
```

## 4. Data Migration Strategy

1. **Extract Extended IPA Data**
   - Create a parser to extract extended IPA symbols from the HTML file
   - Generate standardized JSON data for import

2. **Database Migration**
   - Create migration scripts to update the database schema
   - Add columns to existing tables and create new tables
   - Preserve existing data

3. **Import Extended IPA Data**
   - Import extracted data into the database
   - Map symbols to their correct positions on the chart
   - Link audio files with their symbols

## 5. Implementation Phases

### Phase 1: Database and Core Extensions (1-2 weeks)

- Extend database schema
- Create migration scripts
- Implement extended phoneme endpoints
- Extract and import extended IPA data

### Phase 2: Proposal System (2 weeks)

- Implement proposal model and schema
- Create proposal endpoints
- Add voting functionality
- Implement admin review process

### Phase 3: Discussion Forum (1-2 weeks)

- Implement discussion models and schemas
- Create forum endpoints
- Add reply functionality

### Phase 4: Notification System (1 week)

- Implement notification model and schema
- Create notification endpoints
- Integrate notifications with proposals and forum

### Phase 5: Frontend Integration (2-3 weeks)

- Update existing phoneme chart components
- Create new proposal submission interface
- Implement discussion forum UI
- Add notification display

### Phase 6: Testing and Refinement (1-2 weeks)

- Perform integration testing
- Fix bugs and issues
- Optimize performance
- Refine user experience

## 6. Technical Considerations

### Audio File Handling

- Store audio files in language-specific directories
- Implement proper file validation and security
- Support common audio formats (MP3, WAV, OGG)

### Authentication and Authorization

- Implement basic authentication for proposal submission
- Add admin role for proposal review and management
- Use JWT tokens for secure API access

### Performance Optimizations

- Implement caching for frequently accessed phoneme data
- Use pagination for proposals and forum discussions
- Optimize database queries for extended phoneme searches

## 7. API Response Examples

### Example: Extended Phoneme Response

```json
{
  "consonants": [
    [
      {
        "symbol": "ᴍ",
        "ipa": "ᴍ",
        "example": "voiceless bilabial nasal",
        "description": "Voiceless Bilabial Nasal",
        "audio_file": "Voiceless_Bilabial_Nasal.ogg.mp3",
        "is_extended": true,
        "articulation_type": "nasal",
        "articulation_place": "bilabial"
      },
      null,
      {
        "symbol": "𝼧",
        "ipa": "𝼧",
        "example": "dental nasal",
        "description": "Dental nasal",
        "audio_file": null,
        "is_extended": true,
        "articulation_type": "nasal",
        "articulation_place": "dental"
      }
    ]
  ],
  "vowels": [
    [
      null,
      {
        "symbol": "ᴓ",
        "ipa": "ᴓ",
        "example": "mid front rounded vowel",
        "description": "Mid front rounded vowel",
        "audio_file": "Mid_front_rounded_vowel.ogg.mp3",
        "is_extended": true
      }
    ]
  ],
  "impossible": [
    {
      "symbol": "ɴ̠̊",
      "ipa": "ɴ̠̊",
      "description": "Voiceless pharyngeal nasal",
      "impossibility_reason": "Anatomically impossible due to lack of resonance chamber behind the point of articulation"
    }
  ]
}
```

### Example: Proposal Response

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "symbol": "ꬶ",
  "sound_name": "Voiced postpalatal plosive",
  "category": "consonant",
  "rationale": "This symbol is needed to represent a voiced plosive consonant with a postpalatal place of articulation, which occurs in several underdocumented languages.",
  "example_language": "Hypothetical Language X",
  "audio_file": "voiced_postpalatal_plosive.mp3",
  "submitted_date": "2025-05-07T14:32:10.123456",
  "status": "pending",
  "votes": 5
}
```

## 8. Next Steps and Recommendations

1. Begin with a detailed analysis of the existing HTML file to extract all extended IPA symbols
2. Create a comprehensive data model mapping each symbol to its properties
3. Evaluate the current database schema to determine the most efficient extension approach
4. Develop a prototype of the proposal system before full implementation
5. Consider implementing a simple user registration system for proposal submissions
6. Plan for future internationalization of the interface