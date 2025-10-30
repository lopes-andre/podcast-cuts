# Database Migrations

This directory contains SQL migrations for the Podcast Highlighter database.

## Running Migrations

### Using Supabase CLI

1. Install the Supabase CLI:

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux/Windows (using npx):**
```bash
npx supabase --version
```

**Windows (using Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

2. Login and link to your project:
```bash
supabase login
supabase link --project-ref your-project-ref
```

3. Apply migrations:
```bash
supabase db push
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of each migration file in order
4. Execute each migration

## Migration Order

1. `001_initial_schema.sql` - Creates all tables, indexes, and triggers
2. `002_seed_data.sql` - Inserts default prompt templates

## Local Development

For local development with Docker, the migrations will need to be run manually after starting the PostgreSQL container.

```bash
# Start Docker Compose
docker-compose -f docker/docker-compose.yml up -d

# Connect to the database and run migrations
psql -h localhost -U postgres -d podcast_highlighter -f packages/database/migrations/001_initial_schema.sql
psql -h localhost -U postgres -d podcast_highlighter -f packages/database/migrations/002_seed_data.sql
```

## Schema Overview

The database consists of the following main tables:

- **episodes**: YouTube video metadata and processing status
- **segments**: Transcription segments with timestamps
- **speakers**: Speaker identification per episode
- **segment_speakers**: Many-to-many relationship between segments and speakers
- **prompts**: Versioned AI prompt templates
- **highlights**: Extracted highlight clips with metadata
- **social_profiles**: User's social media accounts
- **highlight_profiles**: Many-to-many relationship for posting targets

