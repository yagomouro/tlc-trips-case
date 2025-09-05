"use client"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import { Volume2, VolumeX, Settings } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface VoiceControlsProps {
  isEnabled: boolean
  isSpeaking: boolean
  speechRate: number
  onToggle: () => void
  onStop: () => void
  onRateChange: (rate: number) => void
}

export function VoiceControls({
  isEnabled,
  isSpeaking,
  speechRate,
  onToggle,
  onStop,
  onRateChange,
}: VoiceControlsProps) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Button
          onClick={isSpeaking ? onStop : onToggle}
          size="sm"
          variant={isEnabled ? "default" : "outline"}
          className={cn(
            "transition-all duration-300 hover-lift",
            isEnabled ? "bg-blue-500 hover:bg-blue-600 text-white" : "hover:border-blue-300 hover:text-blue-600",
            isSpeaking && "animate-pulse",
          )}
        >
          {isSpeaking ? (
            <VolumeX className="h-4 w-4" />
          ) : isEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </Button>

        {isEnabled && (
          <Button
            onClick={() => setShowSettings(!showSettings)}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            <Settings className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showSettings && isEnabled && (
        <Card className="absolute top-full right-0 mt-2 p-4 w-64 z-50 shadow-lg animate-fade-in">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Velocidade da Fala</span>
              <span className="text-xs text-muted-foreground">{speechRate.toFixed(1)}x</span>
            </div>

            <Slider
              value={[speechRate]}
              onValueChange={(value) => onRateChange(value[0])}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Lento</span>
              <span>Normal</span>
              <span>Rápido</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
