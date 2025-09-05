"use client"
import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { useVoice } from "@/hooks/use-voice"
import { cn } from "@/lib/utils"

interface ChatComposerProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
}

export function ChatComposer({ onSendMessage, isLoading }: ChatComposerProps) {
  const [message, setMessage] = useState("")
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { isListening, isSpeaking, transcript, isSupported, toggleListening, stopSpeaking } = useVoice({
    onTranscript: (finalTranscript) => {
      setMessage((prev) => prev + finalTranscript + " ")
      if (textareaRef.current) {
        textareaRef.current.focus()
        const textarea = textareaRef.current
        textarea.style.height = "auto"
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
      }
    },
    onError: (error) => {
      console.error("Voice error:", error)
    },
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "m" && isSupported) {
        e.preventDefault()
        toggleListening()
      }
    }

    document.addEventListener("keydown", handleKeyDown as any)
    return () => document.removeEventListener("keydown", handleKeyDown as any)
  }, [toggleListening, isSupported])

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim())
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
  }

  return (
    <div className="border-t border-border glass-effect p-4 animate-slide-up">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <div className="flex-1 relative group">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening ? "Ouvindo... fale agora" : "Digite sua mensagem... (Enter para enviar, Ctrl+M para voz)"
            }
            className={cn(
              "min-h-[44px] max-h-[120px] resize-none pr-12 rounded-xl border-2 transition-all duration-300 bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg custom-scrollbar",
              isListening
                ? "border-red-500 ring-2 ring-red-500/20 animate-pulse"
                : "border-border hover:border-red-300 focus:border-red-500 dark:hover:border-red-700 dark:focus:border-red-500",
            )}
            disabled={isLoading}
          />

          <div
            className={cn(
              "absolute inset-0 rounded-xl bg-gradient-to-r transition-opacity duration-300 pointer-events-none -z-10 blur-xl",
              isListening
                ? "from-red-500/30 to-red-600/30 opacity-100"
                : "from-red-500/20 to-red-600/20 opacity-0 group-focus-within:opacity-100",
            )}
          />

          {isListening && (
            <div className="absolute top-2 right-2 flex items-center gap-1 text-red-500 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="text-xs font-medium">REC</span>
            </div>
          )}
        </div>

        {isSupported && (
          <Button
            onClick={toggleListening}
            disabled={isLoading}
            size="sm"
            variant={isListening ? "destructive" : "outline"}
            className={cn(
              "h-11 px-3 transition-all duration-300 hover-lift",
              isListening
                ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                : "hover:border-red-300 hover:text-red-600",
            )}
            title={isListening ? "Parar gravação (Ctrl+M)" : "Iniciar gravação de voz (Ctrl+M)"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}

        {/* <Button
          onClick={() => {
            if (isSpeaking) {
              stopSpeaking()
            } else {
              setTtsEnabled(!ttsEnabled)
            }
          }}
          size="sm"
          variant={ttsEnabled ? "default" : "outline"}
          className={cn(
            "h-11 px-3 transition-all duration-300 hover-lift",
            ttsEnabled ? "bg-blue-500 hover:bg-blue-600 text-white" : "hover:border-blue-300 hover:text-blue-600",
            isSpeaking && "animate-pulse",
          )}
          title={ttsEnabled ? "Desativar leitura automática" : "Ativar leitura automática"}
        >
          {isSpeaking ? (
            <VolumeX className="h-4 w-4" />
          ) : ttsEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </Button> */}

        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
          size="sm"
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white border-0 shadow-lg hover:shadow-xl hover-lift transition-all duration-300 h-11 px-4 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          )}
        </Button>
      </div>

      <div className="max-w-4xl mx-auto mt-2">
        <p className="text-xs text-muted-foreground text-center opacity-60 hover:opacity-100 transition-opacity duration-300">
          💡 Dica: Use Ctrl+M para pesquisar por voz e a tecla Enter para enviar a mensagem
        </p>
      </div>
    </div>
  )
}
