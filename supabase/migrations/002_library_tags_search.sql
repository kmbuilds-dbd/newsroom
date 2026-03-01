-- Phase 2: Story Library, Tagging, and Full-text Search

-- Category column (nullable for existing rows)
ALTER TABLE stories ADD COLUMN category text
  CHECK (category IN ('geopolitics','tech','health','economy','science','culture'));
CREATE INDEX idx_stories_category ON stories (category);

-- Tags array (defaults to empty for existing rows)
ALTER TABLE stories ADD COLUMN tags text[] NOT NULL DEFAULT '{}';

-- Full-text search vector (auto-populates for existing rows)
ALTER TABLE stories ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(subtitle,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(event_query,'')), 'C')
  ) STORED;
CREATE INDEX idx_stories_search ON stories USING GIN (search_vector);
