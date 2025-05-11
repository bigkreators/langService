-- Additions to existing schema:

-- For additional phoneme categories
ALTER TABLE phonemes ADD COLUMN articulation_type VARCHAR(50);
ALTER TABLE phonemes ADD COLUMN is_extended BOOLEAN DEFAULT FALSE;

-- For "impossible" phonemes
CREATE TABLE impossible_phonemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    ipa VARCHAR(10),
    description TEXT,
    reason TEXT NOT NULL
);

-- For user proposals
CREATE TABLE phoneme_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    sound_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    rationale TEXT NOT NULL,
    example_language VARCHAR(255),
    audio_file VARCHAR(255),
    image_file VARCHAR(255),
    submitted_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    votes INTEGER NOT NULL DEFAULT 0,
    submitter_id UUID,
    reviewer_id UUID,
    review_date TIMESTAMP
);

-- For discussion forum
CREATE TABLE discussion_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    created_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE discussion_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES discussion_topics(id),
    content TEXT NOT NULL,
    author_name VARCHAR(255),
    created_date TIMESTAMP NOT NULL DEFAULT NOW()
);

-- For notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP NOT NULL DEFAULT NOW()
);
