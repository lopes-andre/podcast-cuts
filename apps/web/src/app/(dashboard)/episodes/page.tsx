"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Video, Plus, ExternalLink } from "lucide-react";
import { formatTimeRange } from "@/lib/utils";

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        <div className="grid gap-4">
          {episodes.map((episode) => (
            <Card key={episode.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Link
                        href={`/episodes/${episode.id}`}
                        className="hover:underline"
                      >
                        {episode.title}
                      </Link>
                      <a
                        href={episode.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Duration: {formatTimeRange(0, episode.duration_seconds)}
                    </CardDescription>
                  </div>
                  <StatusBadge status={episode.status} type="episode" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(episode.created_at).toLocaleDateString()}
                  </div>
                  <Link href={`/episodes/${episode.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

