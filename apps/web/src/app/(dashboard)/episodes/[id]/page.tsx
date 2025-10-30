"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, ExternalLink, Sparkles, Users, FileText } from "lucide-react";
import { formatTimeRange } from "@/lib/utils";

export default function EpisodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const episodeId = params.id as string;

  const [episode, setEpisode] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchEpisodeData();
  }, [episodeId]);

  const seedMockData = async () => {
    if (!confirm("This will populate the episode with mock transcription data. Continue?")) {
      return;
    }

    setSeeding(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/seed/seed-mock-data/${episodeId}`, {
        method: 'POST',
      });

      if (response.ok) {
        alert("Mock data seeded successfully! Refreshing...");
        fetchEpisodeData();
      } else {
        const error = await response.json();
        alert(`Failed to seed data: ${error.detail}`);
      }
    } catch (error) {
      console.error("Failed to seed mock data:", error);
      alert("Failed to seed mock data");
    } finally {
      setSeeding(false);
    }
  };

  const fetchEpisodeData = async () => {
    try {
      // Fetch episode
      const episodeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${episodeId}`);
      if (episodeRes.ok) {
        const episodeData = await episodeRes.json();
        setEpisode(episodeData);
      }

      // Fetch segments
      const segmentsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${episodeId}/segments`);
      if (segmentsRes.ok) {
        const segmentsData = await segmentsRes.json();
        setSegments(segmentsData);
      }

      // Fetch speakers
      const speakersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/speakers/episode/${episodeId}`);
      if (speakersRes.ok) {
        const speakersData = await speakersRes.json();
        setSpeakers(speakersData);
      }

      // Fetch highlights for this episode
      const highlightsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/highlights?episode_id=${episodeId}`);
      if (highlightsRes.ok) {
        const highlightsData = await highlightsRes.json();
        setHighlights(highlightsData);
      }
    } catch (error) {
      console.error("Failed to fetch episode data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading episode...</p>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Episode not found</p>
        <Link href="/episodes">
          <Button variant="outline">Back to Episodes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/episodes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{episode.title}</h1>
            <StatusBadge status={episode.status} type="episode" />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Duration: {formatTimeRange(0, episode.duration_seconds)}</span>
            <span>•</span>
            <span>Created {new Date(episode.created_at).toLocaleDateString()}</span>
            <a
              href={episode.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              YouTube
            </a>
          </div>
        </div>
        {episode.status === "pending" && (
          <Button onClick={seedMockData} disabled={seeding}>
            {seeding ? "Seeding..." : "Seed Mock Data"}
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segments.length}</div>
            <p className="text-xs text-muted-foreground">Transcription segments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Speakers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{speakers.length}</div>
            <p className="text-xs text-muted-foreground">Identified speakers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highlights</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highlights.length}</div>
            <p className="text-xs text-muted-foreground">Detected highlights</p>
          </CardContent>
        </Card>
      </div>

      {/* Speakers Section */}
      {speakers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Speakers</CardTitle>
            <CardDescription>Map speaker labels to real names</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {speakers.map((speaker) => (
                <div key={speaker.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Badge variant="outline">{speaker.speaker_label}</Badge>
                    {speaker.mapped_name && (
                      <span className="ml-2 font-medium">{speaker.mapped_name}</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    {speaker.mapped_name ? "Edit Name" : "Add Name"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcript Section */}
      {episode.full_transcript && (
        <Card>
          <CardHeader>
            <CardTitle>Full Transcript</CardTitle>
            <CardDescription>Complete transcription of the episode</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{episode.full_transcript}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segments Section */}
      {segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Segments ({segments.length})</CardTitle>
            <CardDescription>Transcription with timestamps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {segments.map((segment) => (
                <div key={segment.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatTimeRange(segment.start_s, segment.end_s)}
                    </span>
                    {segment.speakers && segment.speakers.length > 0 && (
                      <div className="flex gap-1">
                        {segment.speakers.map((speaker: string) => (
                          <Badge key={speaker} variant="secondary" className="text-xs">
                            {speaker}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm">{segment.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Highlights Section */}
      {highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Highlights ({highlights.length})</CardTitle>
            <CardDescription>AI-detected highlight moments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-muted-foreground">
                        {formatTimeRange(highlight.start_s, highlight.end_s)}
                      </span>
                      <StatusBadge status={highlight.status} type="highlight" />
                    </div>
                  </div>
                  <p className="text-sm">{highlight.transcript}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {segments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transcript yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              This episode is still being processed. Transcription and speaker detection will appear here once complete.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

