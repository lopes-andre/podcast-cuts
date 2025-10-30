# Project: Podcast Highlighter
## Goals
- Ingest YouTube URL → yt-dlp → ffmpeg → audio (WAV).
- Transcribe PT-BR with WhisperX; diarize with pyannote; merge word-accurate timestamps.
- Run prompt-based highlight extraction; return ONLY {start_s, end_s, text} for each clip.
- Dashboard: review highlights → set status {pending|used|discarded} → export SRT/CSV/JSON.

## Tech (hard constraints)
- Web: Next.js + TypeScript + shadcn/ui; Supabase (Auth/Postgres/Storage).
- Worker: Python 3.11 + FastAPI; WhisperX + pyannote; yt-dlp + ffmpeg.
- DB: Supabase SQL (Postgres). Tables: episodes, speakers, segments, prompt_templates (versioned), highlights.
- Never embed secrets in frontend; use Supabase anon key only on client; service key only server-side.
- Outputs MUST include exact timestamps (hh:mm:ss → hh:mm:ss) AND start_s/end_s (float seconds).

## Coding style
- Backend: ruff + black; type hints; pydantic models for IO.
- Frontend: ESLint + Prettier; Zod for schema; React Query for server state.

## Don’ts
- Don’t auto-publish clips; only propose candidates.
- Don’t commit .env, cookies.txt, raw media; never paste secrets into chat.

