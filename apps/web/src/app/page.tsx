import Link from "next/link";
import { Sparkles, Video, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Highlight Extraction</span>
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Podcast Highlighter
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Extract the most viral moments from your podcasts automatically.
            Transcribe, identify speakers, and discover highlight-worthy clips with AI.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/episodes">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                <Video className="h-5 w-5" />
                View Episodes
              </Button>
            </Link>
            <Link href="/highlights">
              <Button size="lg" variant="outline" className="gap-2">
                <Sparkles className="h-5 w-5" />
                View Highlights
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Smart Transcription</CardTitle>
              <CardDescription>
                Portuguese transcription with WhisperX and automatic speaker diarization using Pyannote.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-purple-500/20">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <CardTitle>AI Highlight Detection</CardTitle>
              <CardDescription>
                Use customizable prompts with GPT-4 or Claude to automatically find viral moments and authority clips.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-pink-500/20">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Multi-Platform Ready</CardTitle>
              <CardDescription>
                Export highlights for TikTok, Instagram, LinkedIn, and YouTube Shorts with SRT, CSV, or JSON formats.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </main>
  );
}

