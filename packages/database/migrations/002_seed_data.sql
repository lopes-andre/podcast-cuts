-- Seed data for Podcast Highlighter
-- Optional: Insert some default prompt templates

-- Insert default prompt templates
INSERT INTO prompts (name, version, template_text, is_active) VALUES
(
    'Authority Moments',
    1,
    'Analyze the following podcast transcript and identify moments where the speakers demonstrate authority, expertise, or unique insights. Look for:
- Bold statements or predictions
- Counter-intuitive insights
- Personal stories of success or failure
- Actionable advice
- Memorable quotes

For each moment, provide the approximate start and end timestamps, and a brief description of why it stands out.

Transcript:
{transcript}',
    true
),
(
    'Hook Quotes',
    1,
    'Analyze the following podcast transcript and identify the most engaging, attention-grabbing quotes that would work well as social media hooks. Look for:
- Surprising or controversial statements
- Emotionally charged moments
- Relatable struggles or wins
- Provocative questions
- Memorable one-liners

For each quote, provide the approximate start and end timestamps.

Transcript:
{transcript}',
    true
),
(
    'Educational Highlights',
    1,
    'Analyze the following podcast transcript and identify segments that teach something valuable. Look for:
- Step-by-step explanations
- Framework descriptions
- Technical concepts explained simply
- How-to instructions
- Case studies or examples

For each educational moment, provide the approximate start and end timestamps and a brief summary.

Transcript:
{transcript}',
    true
),
(
    'Viral Moments',
    1,
    'Analyze the following podcast transcript and identify moments with viral potential for short-form content (TikTok, Instagram Reels, YouTube Shorts). Look for:
- High energy or emotional moments
- Funny or surprising interactions
- Debates or disagreements
- Transformational stories
- Pattern interrupts or unexpected twists

For each moment, provide the approximate start and end timestamps and explain the viral potential.

Transcript:
{transcript}',
    true
);

-- You can add sample social profiles here if needed
-- INSERT INTO social_profiles (platform, profile_name, profile_handle, is_active) VALUES
-- ('instagram', 'My Personal Instagram', '@myhandle', true),
-- ('tiktok', 'My TikTok', '@myhandle', true);

