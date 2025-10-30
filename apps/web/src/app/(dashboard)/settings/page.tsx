"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, Plus, Trash } from "lucide-react";

export default function SettingsPage() {
  const [socialProfiles] = useState([
    {
      id: "1",
      platform: "instagram",
      profile_name: "My Personal Instagram",
      profile_handle: "@myhandle",
      is_active: true,
    },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your social media profiles and API keys
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Social Profiles */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media Profiles</CardTitle>
            <CardDescription>
              Manage where you want to post your highlight clips
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {socialProfiles.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No social profiles configured</p>
              </div>
            ) : (
              <div className="space-y-3">
                {socialProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{profile.profile_name}</span>
                        <Badge variant="outline" className="capitalize">
                          {profile.platform}
                        </Badge>
                        {profile.is_active && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {profile.profile_handle}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Social Profile
            </Button>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Configure API keys for LLM providers and services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                defaultValue="sk-***********************************"
              />
              <p className="text-xs text-muted-foreground">
                Used for GPT-4 highlight detection
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anthropic-key">Anthropic API Key</Label>
              <Input
                id="anthropic-key"
                type="password"
                placeholder="sk-ant-..."
                defaultValue="sk-ant-***********************************"
              />
              <p className="text-xs text-muted-foreground">
                Used for Claude highlight detection
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hf-token">HuggingFace Token</Label>
              <Input
                id="hf-token"
                type="password"
                placeholder="hf_..."
                defaultValue="hf_***********************************"
              />
              <p className="text-xs text-muted-foreground">
                Required for Pyannote speaker diarization
              </p>
            </div>

            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save API Keys
            </Button>
          </CardContent>
        </Card>

        {/* Processing Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Settings</CardTitle>
            <CardDescription>
              Configure default behavior for episode processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="llm-provider">Default LLM Provider</Label>
              <select
                id="llm-provider"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="openai">OpenAI (GPT-4o-mini)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="auto-detect" />
              <Label htmlFor="auto-detect" className="cursor-pointer">
                Auto-detect highlights after transcription
              </Label>
            </div>

            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

