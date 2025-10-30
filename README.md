# Podcast Highlighter

AI-powered podcast highlight extraction tool that automatically identifies the most interesting and viral short moments from long podcast episodes.

## Features

- **YouTube Integration**: Download videos directly from YouTube URLs (including unlisted)
- **High-Accuracy Transcription**: Portuguese transcription using WhisperX with precise timestamps
- **Speaker Diarization**: Automatic speaker detection with Pyannote
- **AI-Powered Highlight Detection**: Customizable prompt templates for finding viral moments
- **Beautiful Web Dashboard**: Modern UI built with Next.js and shadcn-ui
- **Multi-Platform Support**: Track which highlights go to Instagram, TikTok, LinkedIn, or YouTube Shorts
- **Export Functionality**: Export highlights as SRT, CSV, or JSON for video editing
- **Comprehensive Metadata**: Store all transcripts, segments, and highlight data in Supabase

## Tech Stack

### Frontend
- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** + **shadcn-ui** for beautiful, accessible components
- **Supabase** for real-time database access

### Backend
- **FastAPI** with Python 3.11+
- **WhisperX** for transcription
- **Pyannote** for speaker diarization
- **OpenAI** and **Anthropic** for LLM-powered highlight detection
- **yt-dlp** for YouTube video/audio download

### Infrastructure
- **Turborepo** for monorepo management
- **Docker** and **Docker Compose** for containerization
- **Supabase** (PostgreSQL) for database
- **pnpm** for package management

## Project Structure

```
/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Python FastAPI backend
├── packages/
│   ├── typescript-config/ # Shared TypeScript configs
│   ├── eslint-config/    # Shared ESLint configs
│   └── database/         # Supabase types & migrations
├── docker/               # Docker configurations
└── README.md
```

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Python** >= 3.11
- **Docker** and **Docker Compose** (optional, for containerized setup)
- **Supabase** account (or local Supabase instance)
- **API Keys**:
  - OpenAI API key (for GPT-4o)
  - Anthropic API key (for Claude)
  - HuggingFace token (for Pyannote models)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd podcast-highlighter
```

### 2. Install Dependencies

#### Frontend Dependencies

```bash
pnpm install
```

#### Backend Dependencies

```bash
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install WhisperX (optional, but recommended)
pip install git+https://github.com/m-bain/whisperX.git

# Install Pyannote (requires HuggingFace token)
pip install pyannote.audio
```

### 3. Set Up Environment Variables

#### Frontend (.env in apps/web/)

```bash
cd apps/web
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Backend (.env in apps/api/)

```bash
cd apps/api
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-service-role-key

OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
HUGGINGFACE_TOKEN=your-huggingface-token

DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4o-mini
```

### 4. Set Up Database

#### Using Supabase Cloud

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to the SQL Editor in your Supabase dashboard
3. Run the migrations in order:
   - `packages/database/migrations/001_initial_schema.sql`
   - `packages/database/migrations/002_seed_data.sql`

#### Using Local Supabase (Optional)

**Install Supabase CLI:**
```bash
# macOS
brew install supabase/tap/supabase

# Linux/Windows (via npx)
npx supabase --version
```

**Start local instance:**
```bash
supabase init
supabase start
supabase db push
```

### 5. Run Development Servers

#### Option A: Using Turborepo (Recommended)

From the root directory:

```bash
pnpm dev
```

This will start both the web app (port 3000) and the API (port 8000).

#### Option B: Run Separately

**Frontend:**
```bash
cd apps/web
pnpm dev
```

**Backend:**
```bash
cd apps/api
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Access the Application

- **Web Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/health

## Using Docker

### Development with Docker Compose

```bash
# From project root
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down
```

Services:
- **Web**: http://localhost:3000
- **API**: http://localhost:8000
- **PostgreSQL**: localhost:5432

## Usage Guide

### 1. Add a New Episode

1. Click "New Episode" in the dashboard
2. Paste a YouTube URL
3. Click "Process Episode"
4. Wait for transcription and diarization to complete

### 2. Map Speakers

1. Go to the episode detail page
2. Review detected speakers (e.g., SPEAKER_00, SPEAKER_01)
3. Assign real names to each speaker

### 3. Detect Highlights

1. Select one or more prompt templates
2. Click "Detect Highlights"
3. AI will analyze the transcript and identify viral moments

### 4. Manage Highlights

1. Review detected highlights in the Highlights page
2. Mark as "Used", "Pending", or "Discarded"
3. Add comments, links to edited videos
4. Tag which social platforms each highlight is posted to

### 5. Export Highlights

1. Filter highlights by episode, status, or platform
2. Click "Export"
3. Choose format: SRT (for subtitles), CSV (for spreadsheets), or JSON (for programmatic use)

## Prompt Templates

The system includes 4 default prompt templates:

1. **Authority Moments** - Identifies expertise demonstrations and bold statements
2. **Hook Quotes** - Finds attention-grabbing, shareable quotes
3. **Educational Highlights** - Extracts teaching moments and frameworks
4. **Viral Moments** - Detects high-energy, emotionally charged segments

You can create custom prompts in the Prompts page. Use `{transcript}` as a placeholder for the episode transcript.

## Development

### Running Tests

**Backend:**
```bash
cd apps/api
pytest
pytest --cov=app tests/  # With coverage
```

**Frontend:**
```bash
cd apps/web
pnpm test
```

### Code Quality

**Linting:**
```bash
# Root
pnpm lint

# Backend only
cd apps/api
ruff check .
black --check .
mypy .
```

**Format Code:**
```bash
# Frontend
pnpm format

# Backend
cd apps/api
black .
```

### Build for Production

```bash
# Build all
pnpm build

# Build web only
cd apps/web
pnpm build

# Build Docker images
docker build -f docker/web.Dockerfile -t podcast-highlighter-web .
docker build -f docker/api.Dockerfile -t podcast-highlighter-api .
```

## API Endpoints

### Episodes
- `POST /api/episodes/ingest` - Ingest new episode
- `GET /api/episodes` - List episodes
- `GET /api/episodes/{id}` - Get episode details
- `GET /api/episodes/{id}/segments` - Get segments
- `PUT /api/episodes/{id}` - Update episode
- `POST /api/episodes/{id}/detect-highlights` - Detect highlights
- `DELETE /api/episodes/{id}` - Delete episode

### Highlights
- `GET /api/highlights` - List highlights
- `GET /api/highlights/{id}` - Get highlight
- `PUT /api/highlights/{id}` - Update highlight
- `DELETE /api/highlights/{id}` - Delete highlight
- `GET /api/highlights/export/{format}` - Export highlights

### Prompts
- `POST /api/prompts` - Create prompt
- `GET /api/prompts` - List prompts
- `GET /api/prompts/{id}` - Get prompt
- `PUT /api/prompts/{id}` - Update prompt
- `DELETE /api/prompts/{id}` - Delete prompt

### Speakers
- `GET /api/speakers/episode/{episode_id}` - List speakers
- `PUT /api/speakers/{id}` - Update speaker name

## Database Schema

The database consists of 8 main tables:

- **episodes** - Video metadata and processing status
- **segments** - Transcription segments with timestamps
- **speakers** - Speaker identification per episode
- **segment_speakers** - Many-to-many relationship
- **prompts** - Versioned AI prompt templates
- **highlights** - Detected clips with metadata
- **social_profiles** - User's social media accounts
- **highlight_profiles** - Posting targets for highlights

See `packages/database/migrations/` for full schema.

## Troubleshooting

### WhisperX Installation Issues

If WhisperX fails to install:
```bash
pip install torch torchaudio
pip install git+https://github.com/m-bain/whisperX.git
```

### Pyannote Authentication

Pyannote models require HuggingFace authentication:
1. Create an account at [huggingface.co](https://huggingface.co)
2. Accept the Pyannote model license agreements
3. Generate an access token
4. Add to your `.env` file as `HUGGINGFACE_TOKEN`

### Port Already in Use

If ports 3000 or 8000 are in use:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Kill process on port 8000
lsof -ti:8000 | xargs kill
```

## License

[Your License Here]

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For questions or issues, please open a GitHub issue or contact [your-email@example.com].
