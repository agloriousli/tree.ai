import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Brain, Zap, MessageSquare, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ModelTabProps {
  showThinkingMode: boolean
  setShowThinkingMode: (b: boolean) => void
  temperature: number
  setTemperature: (n: number) => void
  maxTokens: number
  setMaxTokens: (n: number) => void
  maxContextMessages: number | null
  setMaxContextMessages: (n: number | null) => void
}

export function ModelTab(props: ModelTabProps) {
  const {
    showThinkingMode,
    setShowThinkingMode,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    maxContextMessages,
    setMaxContextMessages,
  } = props

  return (
    <div className="space-y-6">
      {/* Model Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            Model Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Model</p>
                <p className="text-xs text-muted-foreground">deepseek/deepseek-r1:free</p>
              </div>
              <Badge variant="secondary">Free Tier</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Model can be changed in <code className="bg-muted px-1 rounded">app/api/chat/route.ts</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Control */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Temperature
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature" className="text-sm font-medium">
                Creativity Level
              </Label>
              <span className="text-sm text-muted-foreground">{temperature}</span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={([value]) => setTemperature(value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Focused (0.0)</span>
              <span>Balanced (1.0)</span>
              <span>Creative (2.0)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Higher values make responses more creative and varied. Lower values make responses more focused and deterministic.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Max Tokens */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Response Length
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-tokens" className="text-sm font-medium">
                Max Tokens
              </Label>
              <Input
                id="max-tokens"
                type="number"
                min={100}
                max={32000}
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8000)}
                className="w-20 h-8 text-sm"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Short (1K)</span>
              <span>Medium (8K)</span>
              <span>Long (32K)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum number of tokens in the AI's response. Higher values allow longer responses but may cost more.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Thinking Mode */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            Thinking Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="thinking-mode" className="text-sm font-medium">
                Show Reasoning Process
              </Label>
              <p className="text-xs text-muted-foreground">
                AI will show step-by-step thinking for complex questions
              </p>
            </div>
            <Switch
              id="thinking-mode"
              checked={showThinkingMode}
              onCheckedChange={setShowThinkingMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Context Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Context Management
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="context-limit" className="text-sm font-medium">
                  Max Context Messages
                </Label>
                <p className="text-xs text-muted-foreground">
                  Limit messages sent to AI for context
                </p>
              </div>
              <Switch
                id="context-limit"
                checked={maxContextMessages !== null}
                onCheckedChange={(checked) => setMaxContextMessages(checked ? 15 : null)}
              />
            </div>

            {maxContextMessages !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Messages: {maxContextMessages}</span>
                  <span className="text-xs text-muted-foreground">
                    ~{maxContextMessages * 200} tokens
                  </span>
                </div>
                <Slider
                  min={5}
                  max={100}
                  step={1}
                  value={[maxContextMessages]}
                  onValueChange={([value]) => setMaxContextMessages(value)}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 