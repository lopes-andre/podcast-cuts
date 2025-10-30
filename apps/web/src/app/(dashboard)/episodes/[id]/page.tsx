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
import { HighlightEditor } from "@/components/HighlightEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, ExternalLink, Sparkles, Users, FileText, Edit, Trash2, Calendar, Clock, Video, MessageSquare } from "lucide-react";
import { formatTimestamp, formatTimeRange } from "@/lib/utils";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEpisodeComments, setShowEpisodeComments] = useState(false);
  const [episodeComments, setEpisodeComments] = useState<any[]>([]);
  const [newEpisodeComment, setNewEpisodeComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Highlight filters
  const [statusFilters, setStatusFilters] = useState<string[]>(["pending", "approved", "discarded"]);
  const [speakerFilters, setSpeakerFilters] = useState<string[]>([]);
  const [hasRawLink, setHasRawLink] = useState<boolean | null>(null); // null = both, true = yes, false = no
  const [hasEditedLink, setHasEditedLink] = useState<boolean | null>(null);
  const [hasComments, setHasComments] = useState<boolean | null>(null);
  
  // Highlight editor
  const [editingHighlightId, setEditingHighlightId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  
  // Highlight comments modal
  const [showHighlightComments, setShowHighlightComments] = useState(false);
  const [selectedHighlightForComments, setSelectedHighlightForComments] = useState<any>(null);
  const [newHighlightComment, setNewHighlightComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);

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

  // Handle episode deletion
  const handleDeleteEpisode = async () => {
    if (!confirm("Are you sure you want to delete this episode? This will delete all associated segments, speakers, and highlights. This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${episodeId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        router.push("/episodes");
      } else {
        alert("Failed to delete episode");
      }
    } catch (error) {
      console.error("Error deleting episode:", error);
      alert("Failed to delete episode");
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch episode comments
  const fetchEpisodeComments = async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${episodeId}/comments`
      );
      if (response.ok) {
        const data = await response.json();
        setEpisodeComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch episode comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Add episode comment
  const addEpisodeComment = async () => {
    if (!newEpisodeComment.trim()) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${episodeId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newEpisodeComment }),
        }
      );

      if (response.ok) {
        setNewEpisodeComment("");
        fetchEpisodeComments();
      } else {
        alert("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    }
  };

  // Delete episode comment
  const deleteEpisodeComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/episodes/comments/${commentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        fetchEpisodeComments();
      } else {
        alert("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  // Toggle episode comments dialog
  const toggleEpisodeComments = () => {
    if (!showEpisodeComments) {
      fetchEpisodeComments();
    }
    setShowEpisodeComments(!showEpisodeComments);
  };

  // Add comment to highlight from modal
  const handleAddHighlightComment = async () => {
    if (!newHighlightComment.trim() || !selectedHighlightForComments) return;

    setAddingComment(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/highlights/${selectedHighlightForComments.id}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newHighlightComment }),
        }
      );

      if (!response.ok) throw new Error("Failed to add comment");

      // Refresh highlights to get updated comments
      await fetchEpisodeData();
      
      // Update the selected highlight with new data
      const updatedHighlight = highlights.find(h => h.id === selectedHighlightForComments.id);
      if (updatedHighlight) {
        setSelectedHighlightForComments(updatedHighlight);
      }
      
      setNewHighlightComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment");
    } finally {
      setAddingComment(false);
    }
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
    
    // Filter by raw link
    if (hasRawLink !== null) {
      const hasLink = !!highlight.raw_video_link;
      if (hasLink !== hasRawLink) return false;
    }
    
    // Filter by edited link
    if (hasEditedLink !== null) {
      const hasLink = !!highlight.edited_video_link;
      if (hasLink !== hasEditedLink) return false;
    }
    
    // Filter by comments
    if (hasComments !== null) {
      const hasCommentData = highlight.comments && highlight.comments.length > 0;
      if (hasCommentData !== hasComments) return false;
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
  
  // Check if filters are in default state
  const isDefaultFilterState = () => {
    const defaultStatuses = ["pending", "approved", "discarded"];
    const allSpeakers = Array.from(
      new Set(highlights.flatMap((h) => h.speakers || []))
    );
    
    return (
      statusFilters.length === defaultStatuses.length &&
      statusFilters.every(s => defaultStatuses.includes(s)) &&
      speakerFilters.length === allSpeakers.length &&
      hasRawLink === null &&
      hasEditedLink === null &&
      hasComments === null
    );
  };
  
  // Reset all filters to default
  const resetAllFilters = () => {
    setStatusFilters(["pending", "approved", "discarded"]);
    const allSpeakers = Array.from(
      new Set(highlights.flatMap((h) => h.speakers || []))
    );
    setSpeakerFilters(allSpeakers);
    setHasRawLink(null);
    setHasEditedLink(null);
    setHasComments(null);
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
        
        // Initialize speaker filters with all unique speakers (only once on first load)
        if (speakerFilters.length === 0) {
          const uniqueSpeakers = Array.from(
            new Set(highlightsData.flatMap((h: any) => h.speakers || []))
          );
          setSpeakerFilters(uniqueSpeakers);
        }
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
    <div className="space-y-8">
      {/* Modern Episode Header */}
      <Card className="border-primary/20 overflow-hidden">
        <CardContent className="p-8">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/episodes">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Episodes
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {episode.status === "pending" && (
                <Button onClick={seedMockData} disabled={seeding} variant="outline" size="sm">
                  {seeding ? "Seeding..." : "Seed Mock Data"}
                </Button>
              )}
              <Link href={`/episodes/${episodeId}/edit`}>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteEpisode}
                disabled={isDeleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Thumbnail */}
            {episode.thumbnail_url ? (
              <div className="flex-shrink-0">
                <div className="relative w-64 h-36 rounded-xl overflow-hidden border border-primary/20 shadow-lg">
                  <img
                    src={episode.thumbnail_url}
                    alt={episode.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-shrink-0 w-64 h-36 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-primary/10 flex items-center justify-center">
                <Video className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title and Status */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 leading-tight">{episode.title}</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusBadge status={episode.status} type="episode" />
                    {updating && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                        <span>Updating speakers...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground/70" />
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">
                    {episode.duration_seconds > 0 
                      ? formatTimestamp(episode.duration_seconds)
                      : <span className="text-muted-foreground/50">—</span>
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground/70" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(episode.created_at).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground/70" />
                  <span className="text-muted-foreground">Recorded:</span>
                  <span className="font-medium">
                    {episode.recorded_at 
                      ? new Date(episode.recorded_at).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric' 
                        })
                      : <span className="text-muted-foreground/50">—</span>
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground/70" />
                  <span className="text-muted-foreground">Published:</span>
                  <span className="font-medium">
                    {episode.published_at 
                      ? new Date(episode.published_at).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric' 
                        })
                      : <span className="text-muted-foreground/50">—</span>
                    }
                  </span>
                </div>
              </div>

              {/* Description */}
              {episode.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                  {episode.description}
                </p>
              )}

              {/* Links and Actions */}
              <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                <a
                  href={episode.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  YouTube
                </a>
                {episode.raw_video_link ? (
                  <a
                    href={episode.raw_video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
                  >
                    <Video className="h-4 w-4" />
                    Raw Video
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/40 cursor-not-allowed">
                    <Video className="h-4 w-4" />
                    Raw Video
                  </span>
                )}
                <button
                  onClick={toggleEpisodeComments}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Comments ({episode.comments_count || 0})
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Episode Comments Dialog */}
      <Dialog open={showEpisodeComments} onOpenChange={setShowEpisodeComments}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Episode Comments</DialogTitle>
            <DialogDescription>
              Add and manage comments for this episode.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newEpisodeComment}
                onChange={(e) => setNewEpisodeComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addEpisodeComment();
                  }
                }}
              />
              <Button onClick={addEpisodeComment} disabled={!newEpisodeComment.trim()}>
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>

            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading comments...</p>
              </div>
            ) : episodeComments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                <p className="text-muted-foreground text-center">
                  No comments yet. Be the first to add one!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {episodeComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 border rounded-lg bg-gradient-to-br from-card to-card/50 hover:from-accent/20 hover:to-accent/10 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm">{comment.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEpisodeComment(comment.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
            {/* Compact Unified Filters */}
            <div className="mb-6 p-4 border rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur space-y-4">
              {/* Header with Clear All button */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Filters</Label>
                {!isDefaultFilterState() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetAllFilters}
                    className="h-7 px-3 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              {/* All Filters in Compact Grid */}
              <div className="space-y-3">
                {/* Status Filters */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "pending", gradient: "from-yellow-500 to-amber-500", label: "Pending" },
                      { value: "approved", gradient: "from-green-500 to-emerald-500", label: "Approved" },
                      { value: "discarded", gradient: "from-red-500 to-rose-500", label: "Discarded" },
                    ].map(({ value, gradient, label }) => {
                      const isSelected = statusFilters.includes(value);
                      return (
                        <Badge
                          key={value}
                          onClick={() => toggleStatusFilter(value)}
                          className={`cursor-pointer transition-all select-none ${
                            isSelected
                              ? `bg-gradient-to-r ${gradient} text-white shadow-lg hover:scale-105`
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          <span className="mr-1.5">{isSelected ? "✓" : "○"}</span>
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Speaker Filters */}
                {uniqueHighlightSpeakers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Speakers</Label>
                    <div className="flex gap-2 flex-wrap">
                      {uniqueHighlightSpeakers.map((speaker, idx) => {
                        const speakerIndex = speakers.findIndex(
                          (s) => s.mapped_name === speaker || s.speaker_label === speaker
                        );
                        const isSelected = speakerFilters.includes(speaker);
                        return (
                          <Badge
                            key={speaker}
                            onClick={() => toggleSpeakerFilter(speaker)}
                            className={`cursor-pointer transition-all select-none ${
                              isSelected
                                ? `bg-gradient-to-r ${getSpeakerColor(speakerIndex >= 0 ? speakerIndex : idx)} text-white shadow-lg hover:scale-105`
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            <span className="mr-1.5">{isSelected ? "✓" : "○"}</span>
                            {speaker}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Content Filters (Raw Link, Edited Link, Comments) */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Content</Label>
                  <div className="flex gap-2 flex-wrap">
                    {/* Raw Link Filter */}
                    <Badge
                      onClick={() => setHasRawLink(hasRawLink === true ? null : true)}
                      className={`cursor-pointer transition-all select-none ${
                        hasRawLink === true
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:scale-105"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span className="mr-1.5">{hasRawLink === true ? "✓" : "○"}</span>
                      Has Raw Link
                    </Badge>
                    
                    {/* No Raw Link Filter */}
                    <Badge
                      onClick={() => setHasRawLink(hasRawLink === false ? null : false)}
                      className={`cursor-pointer transition-all select-none ${
                        hasRawLink === false
                          ? "bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg hover:scale-105"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span className="mr-1.5">{hasRawLink === false ? "✓" : "○"}</span>
                      No Raw Link
                    </Badge>
                    
                    {/* Edited Link Filter */}
                    <Badge
                      onClick={() => setHasEditedLink(hasEditedLink === true ? null : true)}
                      className={`cursor-pointer transition-all select-none ${
                        hasEditedLink === true
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:scale-105"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span className="mr-1.5">{hasEditedLink === true ? "✓" : "○"}</span>
                      Has Edited Link
                    </Badge>
                    
                    {/* No Edited Link Filter */}
                    <Badge
                      onClick={() => setHasEditedLink(hasEditedLink === false ? null : false)}
                      className={`cursor-pointer transition-all select-none ${
                        hasEditedLink === false
                          ? "bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg hover:scale-105"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span className="mr-1.5">{hasEditedLink === false ? "✓" : "○"}</span>
                      No Edited Link
                    </Badge>
                    
                    {/* Has Comments Filter */}
                    <Badge
                      onClick={() => setHasComments(hasComments === true ? null : true)}
                      className={`cursor-pointer transition-all select-none ${
                        hasComments === true
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:scale-105"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span className="mr-1.5">{hasComments === true ? "✓" : "○"}</span>
                      Has Comments
                    </Badge>
                    
                    {/* No Comments Filter */}
                    <Badge
                      onClick={() => setHasComments(hasComments === false ? null : false)}
                      className={`cursor-pointer transition-all select-none ${
                        hasComments === false
                          ? "bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg hover:scale-105"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span className="mr-1.5">{hasComments === false ? "✓" : "○"}</span>
                      No Comments
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Highlights List */}
            {filteredHighlights.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No highlights match the selected filters</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredHighlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="border rounded-xl bg-gradient-to-br from-card to-card/80 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200"
                >
                  {/* Header */}
                  <div className="p-5 border-b bg-muted/30">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        <StatusBadge status={highlight.status} type="highlight" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          setEditingHighlightId(highlight.id);
                          setEditorOpen(true);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                    
                    {/* Segments with Individual Timestamps */}
                    {highlight.segments && highlight.segments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Segments ({highlight.segments.length}):</div>
                        {highlight.segments.map((segment: any, segIdx: number) => (
                          <div key={segment.id} className="p-3 bg-background/50 rounded-lg border space-y-2">
                            {/* Segment Header */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs font-mono shrink-0">
                                #{segIdx + 1}
                              </Badge>
                              <span className="text-xs font-mono font-semibold text-primary shrink-0">
                                {formatTimeRange(segment.start_s, segment.end_s)}
                              </span>
                              {segment.speakers && segment.speakers.length > 0 && (
                                <div className="flex gap-1.5 flex-wrap">
                                  {segment.speakers.map((speaker: string, idx: number) => {
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
                              )}
                            </div>
                            {/* Segment Text */}
                            {segment.text && (
                              <p className="text-sm leading-relaxed text-foreground/80 pl-1">
                                {segment.text}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Prompt Info */}
                    {highlight.prompt && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Detected by: <span className="font-medium">{highlight.prompt.name}</span> (v{highlight.prompt.version})</span>
                      </div>
                    )}
                  </div>

                  {/* Transcript */}
                  <div className="p-5">
                    <p className="text-sm leading-relaxed text-foreground/90">{highlight.transcript}</p>
                  </div>

                  {/* Metadata Footer */}
                  <div className="px-5 pb-5 space-y-3">
                    {/* Video Links */}
                    {(highlight.raw_video_link || highlight.edited_video_link) && (
                      <div className="flex items-center gap-3 text-xs">
                        {highlight.raw_video_link ? (
                          <a
                            href={highlight.raw_video_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary hover:underline"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Raw Clip
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground/40">
                            <Video className="h-3.5 w-3.5" />
                            Raw Clip
                          </span>
                        )}
                        {highlight.edited_video_link ? (
                          <a
                            href={highlight.edited_video_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary hover:underline"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Edited Clip
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground/40">
                            <Video className="h-3.5 w-3.5" />
                            Edited Clip
                          </span>
                        )}
                      </div>
                    )}

                    {/* Social Profiles */}
                    {highlight.social_profiles && highlight.social_profiles.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Posted to:</span>
                        {highlight.social_profiles.map((profile: string, idx: number) => (
                          <Badge key={`${profile}-${idx}`} variant="outline" className="text-xs">
                            {profile}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Comments */}
                    {highlight.comments && highlight.comments.length > 0 && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Comments ({highlight.comments.length})
                            </span>
                          </div>
                          {highlight.comments.length > 2 && (
                            <button
                              onClick={() => {
                                setSelectedHighlightForComments(highlight);
                                setShowHighlightComments(true);
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              View All
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {highlight.comments.slice(0, 2).map((comment: any, idx: number) => (
                            <div key={comment.id || idx} className="pl-5 border-l-2 border-primary/20">
                              <p className="text-xs text-foreground/80">{comment.content}</p>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Segment Count */}
                    {highlight.segment_ids && highlight.segment_ids.length > 0 && (
                      <div className="text-xs text-muted-foreground italic">
                        Composed of {highlight.segment_ids.length} segment{highlight.segment_ids.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
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

      {/* Highlight Editor Dialog */}
      {editingHighlightId && (
        <HighlightEditor
          highlight={highlights.find(h => h.id === editingHighlightId)}
          episodeId={episodeId}
          allSegments={segments}
          open={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setEditingHighlightId(null);
          }}
          onSave={() => {
            // Refresh all data after save
            fetchEpisodeData();
          }}
        />
      )}

      {/* Highlight Comments Modal */}
      <Dialog 
        open={showHighlightComments} 
        onOpenChange={(open) => {
          setShowHighlightComments(open);
          if (!open) {
            setSelectedHighlightForComments(null);
            setNewHighlightComment("");
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Highlight Comments
            </DialogTitle>
            <DialogDescription>
              All comments for this highlight ({selectedHighlightForComments?.comments?.length || 0} total)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add New Comment Section */}
            <div className="border-b pb-4">
              <Label htmlFor="new-highlight-comment" className="text-sm font-medium mb-2 block">
                Add New Comment
              </Label>
              <div className="flex gap-2">
                <textarea
                  id="new-highlight-comment"
                  value={newHighlightComment}
                  onChange={(e) => setNewHighlightComment(e.target.value)}
                  placeholder="Add a note or comment..."
                  className="flex-1 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                />
                <Button 
                  onClick={handleAddHighlightComment}
                  disabled={addingComment || !newHighlightComment.trim()}
                  className="self-end"
                >
                  {addingComment ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>

            {/* Existing Comments */}
            <div className="max-h-[50vh] overflow-y-auto">
              <Label className="text-sm font-medium mb-3 block">Comment History</Label>
              {selectedHighlightForComments?.comments && selectedHighlightForComments.comments.length > 0 ? (
                <div className="space-y-3">
                  {selectedHighlightForComments.comments.map((comment: any, idx: number) => (
                    <div key={comment.id || idx} className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-sm mb-2">{comment.content}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No comments yet</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowHighlightComments(false);
                setSelectedHighlightForComments(null);
                setNewHighlightComment("");
              }}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setShowHighlightComments(false);
                setEditingHighlightId(selectedHighlightForComments.id);
                setEditorOpen(true);
              }}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Highlight
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

