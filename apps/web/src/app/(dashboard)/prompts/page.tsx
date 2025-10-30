"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Edit, Trash } from "lucide-react";

export default function PromptsPage() {
  // Mock data - will be replaced with API calls
  const [prompts] = useState([
    {
      id: "1",
      name: "Authority Moments",
      version: 1,
      is_active: true,
      template_text: "Analyze the following podcast transcript...",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Hook Quotes",
      version: 1,
      is_active: true,
      template_text: "Analyze the following podcast transcript...",
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Educational Highlights",
      version: 1,
      is_active: true,
      template_text: "Analyze the following podcast transcript...",
      created_at: new Date().toISOString(),
    },
    {
      id: "4",
      name: "Viral Moments",
      version: 1,
      is_active: true,
      template_text: "Analyze the following podcast transcript...",
      created_at: new Date().toISOString(),
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prompt Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage AI prompts for highlight detection
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {prompts.map((prompt) => (
          <Card key={prompt.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{prompt.name}</CardTitle>
                    {prompt.is_active && (
                      <Badge variant="default">Active</Badge>
                    )}
                    <Badge variant="outline">v{prompt.version}</Badge>
                  </div>
                  <CardDescription>
                    Created {new Date(prompt.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {prompt.template_text}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-3 w-3" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash className="mr-2 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Prompt Templates</CardTitle>
          <CardDescription>
            How to create effective prompts for highlight detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Template Variables</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Use <code className="bg-muted px-1 rounded">{"{transcript}"}</code> in your
              template to insert the episode transcript.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Best Practices</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Be specific about what kind of moments you want to find</li>
              <li>Provide examples of good highlights</li>
              <li>Request timestamps in your prompt</li>
              <li>Ask for JSON format for structured output</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

