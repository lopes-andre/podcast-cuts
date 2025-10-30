"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Video,
  MessageSquare,
  Plus,
  Trash2,
  Save,
  X,
  GripVertical,
  Sparkles,
} from "lucide-react";

interface HighlightEditorProps {
  highlight: any;
  episodeId: string;
  allSegments: any[];
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function HighlightEditor({
  highlight,
  episodeId,
  allSegments,
  open,
  onClose,
  onSave,
}: HighlightEditorProps) {
  // Form state
  const [status, setStatus] = useState(highlight.status || "pending");
  const [rawVideoLink, setRawVideoLink] = useState(highlight.raw_video_link || "");
  const [editedVideoLink, setEditedVideoLink] = useState(highlight.edited_video_link || "");
  
  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  
  // Segments state
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
  const [availableSegments, setAvailableSegments] = useState<any[]>([]);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "comments" | "segments">("basic");

  // Load data when highlight changes
  useEffect(() => {
    if (highlight) {
      setStatus(highlight.status || "pending");
      setRawVideoLink(highlight.raw_video_link || "");
      setEditedVideoLink(highlight.edited_video_link || "");
      setComments(highlight.comments || []);
      setSelectedSegmentIds(highlight.segment_ids || []);
      
      // Filter available segments (all segments from the episode)
      setAvailableSegments(allSegments || []);
    }
  }, [highlight, allSegments]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveTab("basic");
      setNewComment("");
      setEditingCommentId(null);
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // 1. Update basic highlight fields
      await fetch(`${apiUrl}/api/highlights/${highlight.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          raw_video_link: rawVideoLink || null,
          edited_video_link: editedVideoLink || null,
        }),
      });

      // 2. Update segments (bulk update)
      if (selectedSegmentIds.length > 0) {
        await fetch(`${apiUrl}/api/highlights/${highlight.id}/segments`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segment_ids: selectedSegmentIds }),
        });
      }

      // 3. Handle comment updates (simplified - just add new ones for now)
      if (newComment.trim()) {
        await fetch(`${apiUrl}/api/highlights/${highlight.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newComment }),
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save highlight:", error);
      alert("Failed to save highlight. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/api/highlights/comments/${commentId}`, {
        method: "DELETE",
      });
      
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment");
    }
  };

  const toggleSegment = (segmentId: string) => {
    setSelectedSegmentIds(prev => {
      if (prev.includes(segmentId)) {
        return prev.filter(id => id !== segmentId);
      } else {
        // Add to the end
        return [...prev, segmentId];
      }
    });
  };

  const moveSegment = (segmentId: string, direction: "up" | "down") => {
    const index = selectedSegmentIds.indexOf(segmentId);
    if (index === -1) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedSegmentIds.length) return;
    
    const newOrder = [...selectedSegmentIds];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setSelectedSegmentIds(newOrder);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Edit Highlight
          </DialogTitle>
          <DialogDescription>
            Update highlight details, manage comments, and compose segments
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("basic")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "basic"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "comments"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Comments ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab("segments")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "segments"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Segments ({selectedSegmentIds.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Basic Tab */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <div className="flex gap-2 mt-2">
                  {["pending", "approved", "discarded"].map((s) => (
                    <Button
                      key={s}
                      variant={status === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatus(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="raw_video_link" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Raw Video Link
                </Label>
                <Input
                  id="raw_video_link"
                  value={rawVideoLink}
                  onChange={(e) => setRawVideoLink(e.target.value)}
                  placeholder="https://..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="edited_video_link" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Edited Video Link
                </Label>
                <Input
                  id="edited_video_link"
                  value={editedVideoLink}
                  onChange={(e) => setEditedVideoLink(e.target.value)}
                  placeholder="https://..."
                  className="mt-2"
                />
              </div>

              <div className="pt-4 border-t">
                <Label className="text-muted-foreground">Transcript (Read-only)</Label>
                <p className="mt-2 text-sm p-3 bg-muted/50 rounded border">{highlight.transcript}</p>
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              {/* Add New Comment */}
              <div className="pb-4 border-b">
                <Label htmlFor="new_comment" className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4" />
                  Add New Comment
                </Label>
                <Textarea
                  id="new_comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a note or comment..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              {/* Comment History */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Comment History</Label>
                {comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm flex-1">{comment.content}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No comments yet</p>
                )}
              </div>
            </div>
          )}

          {/* Segments Tab */}
          {activeTab === "segments" && (
            <div className="space-y-4">
              {/* Selected Segments (Ordered) */}
              <div>
                <Label className="mb-3 block">Selected Segments (in order)</Label>
                {selectedSegmentIds.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSegmentIds.map((segmentId, index) => {
                      const segment = availableSegments.find(s => s.id === segmentId);
                      if (!segment) return null;
                      
                      return (
                        <div
                          key={segmentId}
                          className="flex items-start gap-3 p-3 border rounded-lg bg-primary/5"
                        >
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSegment(segmentId, "up")}
                              disabled={index === 0}
                              className="h-6 px-2"
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSegment(segmentId, "down")}
                              disabled={index === selectedSegmentIds.length - 1}
                              className="h-6 px-2"
                            >
                              ↓
                            </Button>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground mb-1">
                              #{index + 1} • {formatTime(segment.start_s)} → {formatTime(segment.end_s)}
                            </div>
                            <p className="text-sm line-clamp-2">{segment.text}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSegment(segmentId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No segments selected. Add segments from below.
                  </p>
                )}
              </div>

              {/* Available Segments */}
              <div className="pt-4 border-t">
                <Label className="mb-3 block">Available Segments</Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableSegments
                    .filter(seg => !selectedSegmentIds.includes(seg.id))
                    .map((segment) => (
                      <div
                        key={segment.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => toggleSegment(segment.id)}
                      >
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">
                            {formatTime(segment.start_s)} → {formatTime(segment.end_s)}
                            {segment.speakers && segment.speakers.length > 0 && (
                              <span className="ml-2">• {segment.speakers.join(", ")}</span>
                            )}
                          </div>
                          <p className="text-sm line-clamp-2">{segment.text}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent event bubbling to parent div
                            toggleSegment(segment.id);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

