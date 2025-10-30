"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Sparkles, ExternalLink, Download } from "lucide-react";
import { formatTimeRange } from "@/lib/utils";

export default function HighlightsPage() {
  // Mock data - will be replaced with API calls
  const [highlights] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "used" | "discarded">("all");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Highlights</h1>
          <p className="text-muted-foreground mt-2">
            Manage detected highlight clips across all episodes
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          Pending
        </Button>
        <Button
          variant={filter === "used" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("used")}
        >
          Used
        </Button>
        <Button
          variant={filter === "discarded" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("discarded")}
        >
          Discarded
        </Button>
      </div>

      {highlights.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No highlights yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Process an episode and run highlight detection to find viral moments
              automatically using AI.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {highlights.map((highlight: any) => (
            <Card key={highlight.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">
                        {formatTimeRange(highlight.start_s, highlight.end_s)}
                      </CardTitle>
                      <StatusBadge status={highlight.status} type="highlight" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Episode: {highlight.episode?.title || "Unknown"}
                    </p>
                    <p className="text-sm">{highlight.transcript}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {highlight.status === "pending" && (
                      <>
                        <Button variant="outline" size="sm">
                          Mark as Used
                        </Button>
                        <Button variant="ghost" size="sm">
                          Discard
                        </Button>
                      </>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-3 w-3" />
                    View in Episode
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

