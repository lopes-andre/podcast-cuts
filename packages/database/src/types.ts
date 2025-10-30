// Database types

export type EpisodeStatus = "pending" | "processing" | "completed" | "failed";
export type HighlightStatus = "pending" | "used" | "discarded";
export type SocialPlatform = "instagram" | "tiktok" | "linkedin" | "youtube_shorts";

export interface Episode {
  id: string;
  youtube_url: string;
  title: string;
  duration_seconds: number;
  raw_video_link?: string;
  published_video_link?: string;
  recorded_at?: string;
  published_at?: string;
  full_transcript?: string;
  status: EpisodeStatus;
  created_at: string;
  updated_at: string;
}

export interface Segment {
  id: string;
  episode_id: string;
  start_s: number;
  end_s: number;
  text: string;
  confidence: number;
  created_at: string;
}

export interface Speaker {
  id: string;
  episode_id: string;
  speaker_label: string;
  mapped_name?: string;
  created_at: string;
}

export interface SegmentSpeaker {
  segment_id: string;
  speaker_id: string;
}

export interface Prompt {
  id: string;
  name: string;
  version: number;
  template_text: string;
  is_active: boolean;
  created_at: string;
}

export interface Highlight {
  id: string;
  episode_id: string;
  prompt_id?: string;
  start_s: number;
  end_s: number;
  transcript: string;
  status: HighlightStatus;
  comments?: string;
  raw_video_link?: string;
  edited_video_link?: string;
  created_at: string;
  updated_at: string;
}

export interface SocialProfile {
  id: string;
  platform: SocialPlatform;
  profile_name: string;
  profile_handle?: string;
  profile_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface HighlightProfile {
  highlight_id: string;
  profile_id: string;
  posted_at?: string;
  post_url?: string;
}

// Joined/Extended types for queries
export interface SegmentWithSpeakers extends Segment {
  speakers?: Speaker[];
}

export interface HighlightWithRelations extends Highlight {
  episode?: Episode;
  prompt?: Prompt;
  profiles?: SocialProfile[];
}

export interface EpisodeWithSegments extends Episode {
  segments?: SegmentWithSpeakers[];
  speakers?: Speaker[];
  highlights?: Highlight[];
}

