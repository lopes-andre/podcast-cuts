"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";

export default function NewEpisodePage() {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: any = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/episodes/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtube_url: youtubeUrl,
          auto_detect_highlights: false,
          prompt_ids: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle duplicate episode error
        if (response.status === 409) {
          const message = error.detail || 'Episode already exists';
          const episodeIdMatch = message.match(/Episode ID: ([a-f0-9-]+)/);
          
          if (episodeIdMatch && confirm(`${message}\n\nWould you like to view the existing episode?`)) {
            router.push(`/episodes/${episodeIdMatch[1]}`);
            return;
          } else {
            alert(message);
            router.push("/episodes");
            return;
          }
        }
        
        throw new Error(error.detail || 'Failed to create episode');
      }

      const episode = await response.json();
      console.log("Episode created:", episode);
      
      // Redirect to episodes list
      router.push("/episodes");
    } catch (error) {
      console.error("Failed to create episode:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create episode'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/episodes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Episode</h1>
          <p className="text-muted-foreground mt-2">
            Add a new podcast episode from YouTube
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>YouTube Video Details</CardTitle>
            <CardDescription>
              Provide a YouTube URL to start processing. The video can be public or unlisted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube URL</Label>
                <Input
                  id="youtube-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">What happens next?</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Video is downloaded and audio extracted</li>
                  <li>Audio is transcribed using WhisperX (Portuguese)</li>
                  <li>Speakers are detected and diarized with Pyannote</li>
                  <li>You can review transcript and map speaker names</li>
                  <li>Detect highlights using customizable AI prompts</li>
                </ol>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading || !youtubeUrl}>
                  {isLoading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Process Episode
                    </>
                  )}
                </Button>
                <Link href="/episodes">
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

