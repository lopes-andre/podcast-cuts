"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, ExternalLink, Sparkles, Users, FileText, Edit } from "lucide-react";
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
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [speakerNameInput, setSpeakerNameInput] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState(false);
  
  // Highlight filters
  const [statusFilters, setStatusFilters] = useState<string[]>(["pending", "approved", "discarded"]);
  const [speakerFilters, setSpeakerFilters] = useState<string[]>([]);

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

  const updateSpeakerName = async (speakerId: string) => {
    const newName = speakerNameInput[speakerId];
    if (!newName || !newName.trim()) return;

    // Optimistic update - update UI immediately for instant feedback
    const oldSpeakers = [...speakers];
    const updatedSpeakers = speakers.map((s) =>
      s.id === speakerId ? { ...s, mapped_name: newName.trim() } : s
    );
    setSpeakers(updatedSpeakers);
    
    // Close dialog immediately
    setOpenDialogId(null);
    setSpeakerNameInput((prev) => {
      const updated = { ...prev };
      delete updated[speakerId];
      return updated;
    });

    setUpdating(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/speakers/${speakerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mapped_name: newName.trim() }),
        }
      );

      if (response.ok) {
        // Refetch in background to update segments and highlights with new speaker names
        const [speakersRes, segmentsRes, highlightsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/speakers/episode/${episodeId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${episodeId}/segments`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/highlights?episode_id=${episodeId}`),
        ]);

        if (speakersRes.ok) {
          const speakersData = await speakersRes.json();
          setSpeakers(speakersData);
        }

        if (segmentsRes.ok) {
          const segmentsData = await segmentsRes.json();
          setSegments(segmentsData);
        }

        if (highlightsRes.ok) {
          const highlightsData = await highlightsRes.json();
          setHighlights(highlightsData);
        }
      } else {
        // Rollback on error
        setSpeakers(oldSpeakers);
        alert("Failed to update speaker name");
      }
    } catch (error) {
      console.error("Failed to update speaker:", error);
      // Rollback on error
      setSpeakers(oldSpeakers);
      alert("Failed to update speaker name");
    } finally {
      setUpdating(false);
    }
  };

  // Helper function to get speaker color based on index
  const getSpeakerColor = (index: number) => {
    const colors = [
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-pink-500",
      "from-orange-500 to-red-500",
      "from-green-500 to-emerald-500",
      "from-yellow-500 to-orange-500",
      "from-pink-500 to-rose-500",
      "from-indigo-500 to-purple-500",
      "from-teal-500 to-green-500",
    ];
    return colors[index % colors.length];
  };

  // Filter highlights based on selected filters
  const filteredHighlights = highlights.filter((highlight) => {
    // Filter by status
    if (!statusFilters.includes(highlight.status)) {
      return false;
    }
    
    // Filter by speaker (if any speaker filter is selected)
    if (speakerFilters.length > 0 && highlight.speakers) {
      const hasMatchingSpeaker = highlight.speakers.some((speaker: string) =>
        speakerFilters.includes(speaker)
      );
      if (!hasMatchingSpeaker) {
        return false;
      }
    }
    
    return true;
  });

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleSpeakerFilter = (speaker: string) => {
    setSpeakerFilters((prev) =>
      prev.includes(speaker) ? prev.filter((s) => s !== speaker) : [...prev, speaker]
    );
  };

  // Get unique speakers from all highlights
  const uniqueHighlightSpeakers = Array.from(
    new Set(highlights.flatMap((h) => h.speakers || []))
  );

  const fetchEpisodeData = async () => {
    try {
      // Fetch all data in parallel for better performance
      const [episodeRes, segmentsRes, speakersRes, highlightsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${episodeId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${episodeId}/segments`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/speakers/episode/${episodeId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/highlights?episode_id=${episodeId}`),
      ]);

      if (episodeRes.ok) {
        const episodeData = await episodeRes.json();
        setEpisode(episodeData);
      }

      if (segmentsRes.ok) {
        const segmentsData = await segmentsRes.json();
        setSegments(segmentsData);
      }

      if (speakersRes.ok) {
        const speakersData = await speakersRes.json();
        setSpeakers(speakersData);
      }

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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            {updating && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                <span>Updating...</span>
              </div>
            )}
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
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Speakers
            </CardTitle>
            <CardDescription>Map speaker labels to real names for better identification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {speakers.map((speaker, index) => (
                <div
                  key={speaker.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getSpeakerColor(index)} flex items-center justify-center text-white font-semibold`}>
                      {speaker.mapped_name ? speaker.mapped_name[0].toUpperCase() : "?"}
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-1">
                        {speaker.speaker_label}
                      </Badge>
                      {speaker.mapped_name ? (
                        <p className="font-medium">{speaker.mapped_name}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No name set</p>
                      )}
                    </div>
                  </div>
                  <Dialog 
                    open={openDialogId === speaker.id} 
                    onOpenChange={(open) => {
                      if (open) {
                        setOpenDialogId(speaker.id);
                        setSpeakerNameInput((prev) => ({
                          ...prev,
                          [speaker.id]: speaker.mapped_name || "",
                        }));
                      } else {
                        setOpenDialogId(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        {speaker.mapped_name ? "Edit" : "Set Name"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Speaker Name</DialogTitle>
                        <DialogDescription>
                          Assign a name to {speaker.speaker_label} for better identification in
                          transcripts and highlights.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor={`speaker-name-${speaker.id}`}>Speaker Name</Label>
                          <Input
                            id={`speaker-name-${speaker.id}`}
                            placeholder="e.g., André, Maria, Host..."
                            value={speakerNameInput[speaker.id] || ""}
                            onChange={(e) =>
                              setSpeakerNameInput((prev) => ({
                                ...prev,
                                [speaker.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateSpeakerName(speaker.id);
                              }
                            }}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={() => updateSpeakerName(speaker.id)} 
                          disabled={!speakerNameInput[speaker.id]?.trim()}
                        >
                          Save Name
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Segments ({segments.length})
            </CardTitle>
            <CardDescription>Transcription with timestamps and speaker identification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                        {formatTimeRange(segment.start_s, segment.end_s)}
                      </span>
                      {segment.speakers && segment.speakers.length > 0 && (
                        <div className="flex gap-1">
                          {segment.speakers.map((speaker: string, idx: number) => {
                            // Find speaker index for consistent coloring
                            const speakerIndex = speakers.findIndex(
                              (s) => s.mapped_name === speaker || s.speaker_label === speaker
                            );
                            return (
                              <Badge
                                key={`${speaker}-${idx}`}
                                variant="default"
                                className={`text-xs bg-gradient-to-r ${getSpeakerColor(speakerIndex >= 0 ? speakerIndex : idx)}`}
                              >
                                {speaker}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{segment.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Highlights Section */}
      {highlights.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Highlights ({filteredHighlights.length} of {highlights.length})
            </CardTitle>
            <CardDescription>AI-detected highlight moments with speaker information</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 space-y-4 p-6 border rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur">
              <div>
                <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  Filter by Status
                </Label>
                <div className="flex gap-2">
                  {[
                    { value: "pending", gradient: "from-yellow-500 to-amber-500" },
                    { value: "approved", gradient: "from-green-500 to-emerald-500" },
                    { value: "discarded", gradient: "from-red-500 to-rose-500" },
                  ].map(({ value, gradient }) => (
                    <Badge
                      key={value}
                      onClick={() => toggleStatusFilter(value)}
                      className={`cursor-pointer transition-all capitalize ${
                        statusFilters.includes(value)
                          ? `bg-gradient-to-r ${gradient} text-white shadow-lg hover:scale-105`
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>

              {uniqueHighlightSpeakers.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                    Filter by Speaker
                    {speakerFilters.length > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({speakerFilters.length} selected)
                      </span>
                    )}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueHighlightSpeakers.map((speaker, idx) => {
                      const speakerIndex = speakers.findIndex(
                        (s) => s.mapped_name === speaker || s.speaker_label === speaker
                      );
                      const isActive = speakerFilters.includes(speaker) || speakerFilters.length === 0;
                      return (
                        <Badge
                          key={speaker}
                          onClick={() => toggleSpeakerFilter(speaker)}
                          className={`cursor-pointer transition-all ${
                            isActive
                              ? `bg-gradient-to-r ${getSpeakerColor(speakerIndex >= 0 ? speakerIndex : idx)} text-white shadow-lg hover:scale-105`
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {speaker}
                        </Badge>
                      );
                    })}
                    {speakerFilters.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSpeakerFilters([])}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Highlights List */}
            {filteredHighlights.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No highlights match the selected filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHighlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="p-4 border rounded-lg bg-gradient-to-br from-card to-card/50 hover:from-accent/20 hover:to-accent/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                        {formatTimeRange(highlight.start_s, highlight.end_s)}
                      </span>
                      <StatusBadge status={highlight.status} type="highlight" />
                      {highlight.speakers && highlight.speakers.length > 0 ? (
                        <div className="flex gap-1">
                          {highlight.speakers.map((speaker: string, idx: number) => {
                            // Find speaker index for consistent coloring
                            const speakerIndex = speakers.findIndex(
                              (s) => s.mapped_name === speaker || s.speaker_label === speaker
                            );
                            return (
                              <Badge
                                key={`${speaker}-${idx}`}
                                variant="default"
                                className={`text-xs bg-gradient-to-r ${getSpeakerColor(speakerIndex >= 0 ? speakerIndex : idx)}`}
                              >
                              <Users className="h-3 w-3 mr-1" />
                              {speaker}
                            </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          (No speakers detected)
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{highlight.transcript}</p>
                  {highlight.reasoning && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      💡 {highlight.reasoning}
                    </p>
                  )}
                </div>
              ))}
              </div>
            )}
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

