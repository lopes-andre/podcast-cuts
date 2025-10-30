"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { Video, Plus, ExternalLink, Edit, Trash2, Calendar, Clock, FileText, MessageSquare, Send, X } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";

interface EditFormData {
  title: string;
  description: string;
  raw_video_link: string;
  recorded_at: string;
  published_at: string;
}

interface Comment {
  id: string;
  episode_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    title: "",
    description: "",
    raw_video_link: "",
    recorded_at: "",
    published_at: "",
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/episodes`);
      if (response.ok) {
        const data = await response.json();
        setEpisodes(data);
      }
    } catch (error) {
      console.error("Failed to fetch episodes:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (episode: any) => {
    setEditDialogOpen(episode.id);
    setEditFormData({
      title: episode.title || "",
      description: episode.description || "",
      raw_video_link: episode.raw_video_link || "",
      recorded_at: episode.recorded_at ? episode.recorded_at.split("T")[0] : "",
      published_at: episode.published_at ? episode.published_at.split("T")[0] : "",
    });
  };

  const fetchComments = async (episodeId: string) => {
    setLoadingComments(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${episodeId}/comments`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const openCommentsDialog = (episodeId: string) => {
    setCommentsDialogOpen(episodeId);
    fetchComments(episodeId);
  };

  const addComment = async () => {
    if (!commentsDialogOpen || !newComment.trim()) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${commentsDialogOpen}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newComment }),
        }
      );

      if (response.ok) {
        setNewComment("");
        fetchComments(commentsDialogOpen);
      } else {
        alert("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/episodes/comments/${commentId}`,
        { method: "DELETE" }
      );

      if (response.ok && commentsDialogOpen) {
        fetchComments(commentsDialogOpen);
      } else {
        alert("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  const handleEditSubmit = async () => {
    if (!editDialogOpen) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${editDialogOpen}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editFormData.title || undefined,
            description: editFormData.description || undefined,
            raw_video_link: editFormData.raw_video_link || undefined,
            recorded_at: editFormData.recorded_at ? `${editFormData.recorded_at}T00:00:00Z` : undefined,
            published_at: editFormData.published_at ? `${editFormData.published_at}T00:00:00Z` : undefined,
          }),
        }
      );

      if (response.ok) {
        setEditDialogOpen(null);
        fetchEpisodes();
      } else {
        alert("Failed to update episode");
      }
    } catch (error) {
      console.error("Error updating episode:", error);
      alert("Failed to update episode");
    }
  };

  const handleDelete = async (episodeId: string) => {
    if (!confirm("Are you sure you want to delete this episode? This will delete all associated segments, speakers, and highlights. This action cannot be undone.")) {
      return;
    }

    setIsDeleting(episodeId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/episodes/${episodeId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setEpisodes(episodes.filter((ep) => ep.id !== episodeId));
      } else {
        alert("Failed to delete episode");
      }
    } catch (error) {
      console.error("Error deleting episode:", error);
      alert("Failed to delete episode");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Episodes</h1>
          <p className="text-muted-foreground mt-2">
            Manage your podcast episodes and transcripts
          </p>
        </div>
        <Link href="/episodes/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Episode
          </Button>
        </Link>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Loading episodes...</p>
          </CardContent>
        </Card>
      ) : episodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No episodes yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Start by adding your first podcast episode. Provide a YouTube URL and let AI
              handle the transcription and speaker detection.
            </p>
            <Link href="/episodes/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Episode
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {episodes.map((episode) => (
            <Link
              key={episode.id}
              href={`/episodes/${episode.id}`}
              className="block group"
            >
              <Card className="border-primary/10 hover:border-primary/30 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer relative overflow-hidden">
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Thumbnail */}
                    {episode.thumbnail_url ? (
                      <div className="flex-shrink-0">
                        <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-primary/10 shadow-md group-hover:shadow-xl group-hover:border-primary/20 transition-all duration-200">
                          <img
                            src={episode.thumbnail_url}
                            alt={episode.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-48 h-28 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-primary/10 flex items-center justify-center">
                        <Video className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header: Title + Status */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">
                            {episode.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Created {new Date(episode.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <a
                              href={episode.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                              YouTube
                            </a>
                          </div>
                        </div>
                        <StatusBadge status={episode.status} type="episode" />
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
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
                          <span className="text-muted-foreground">Recorded:</span>
                          <span className="font-medium">
                            {episode.recorded_at 
                              ? new Date(episode.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : <span className="text-muted-foreground/50">—</span>
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground/70" />
                          <span className="text-muted-foreground">Published:</span>
                          <span className="font-medium">
                            {episode.published_at 
                              ? new Date(episode.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : <span className="text-muted-foreground/50">—</span>
                            }
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {episode.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                          {episode.description}
                        </p>
                      )}

                      {/* Actions Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-4 text-xs">
                          {episode.raw_video_link ? (
                            <a
                              href={episode.raw_video_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-primary hover:underline transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Raw Video
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground/40 cursor-not-allowed">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Raw Video
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openCommentsDialog(episode.id);
                            }}
                            className="inline-flex items-center gap-1.5 text-primary hover:underline transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Comments ({episode.comments_count || 0})
                          </button>
                        </div>
                        
                        {/* Floating Action Buttons */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Dialog open={editDialogOpen === episode.id} onOpenChange={(open) => !open && setEditDialogOpen(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openEditDialog(episode);
                                }}
                                className="backdrop-blur-sm bg-background/80 hover:bg-background shadow-md"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                Edit
                              </Button>
                            </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Episode</DialogTitle>
                          <DialogDescription>
                            Update episode information including title, video links, and dates.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              value={editFormData.title}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, title: e.target.value })
                              }
                              placeholder="Episode title"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                              id="description"
                              value={editFormData.description}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, description: e.target.value })
                              }
                              placeholder="Episode description from YouTube..."
                              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              rows={4}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="raw_video_link">Raw Video Link</Label>
                            <Input
                              id="raw_video_link"
                              value={editFormData.raw_video_link}
                              onChange={(e) =>
                                setEditFormData({ ...editFormData, raw_video_link: e.target.value })
                              }
                              placeholder="https://..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="recorded_at" className="text-sm font-medium">Recorded At</Label>
                              <div className="relative">
                                <Input
                                  id="recorded_at"
                                  type="date"
                                  value={editFormData.recorded_at}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, recorded_at: e.target.value })
                                  }
                                  className="w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:hover:bg-accent [&::-webkit-calendar-picker-indicator]:rounded [&::-webkit-calendar-picker-indicator]:p-1"
                                />
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="published_at" className="text-sm font-medium">Published At</Label>
                              <div className="relative">
                                <Input
                                  id="published_at"
                                  type="date"
                                  value={editFormData.published_at}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, published_at: e.target.value })
                                  }
                                  className="w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:hover:bg-accent [&::-webkit-calendar-picker-indicator]:rounded [&::-webkit-calendar-picker-indicator]:p-1"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditDialogOpen(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleEditSubmit}>Save Changes</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(episode.id);
                            }}
                            disabled={isDeleting === episode.id}
                            className="backdrop-blur-sm bg-destructive/80 hover:bg-destructive shadow-md"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            {isDeleting === episode.id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Comments Dialog */}
      <Dialog 
        open={!!commentsDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setCommentsDialogOpen(null);
            fetchEpisodes(); // Refresh episodes to update comment counts
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Episode Comments</DialogTitle>
            <DialogDescription>
              Add, view, and manage comments for this episode.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Add new comment */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addComment();
                  }
                }}
              />
              <Button onClick={addComment} disabled={!newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments list */}
            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                <p className="text-muted-foreground text-center">
                  No comments yet. Be the first to add one!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
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
                        onClick={() => deleteComment(comment.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

