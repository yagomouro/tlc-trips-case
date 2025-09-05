"use client"
import { useState, useEffect, useRef, useCallback } from "react"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface UseVoiceOptions {
  onTranscript?: (transcript: string) => void
  onError?: (error: string) => void
}

export function useVoice({ onTranscript, onError }: UseVoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [speechRate, setSpeechRate] = useState(1)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    // Check for browser support
    const hasWebSpeech = "webkitSpeechRecognition" in window || "SpeechRecognition" in window
    const hasSpeechSynthesis = "speechSynthesis" in window

    setIsSupported(hasWebSpeech && hasSpeechSynthesis)

    if (hasWebSpeech) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      if (recognitionRef.current) {
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "pt-BR"

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ""
          let interimTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          const fullTranscript = finalTranscript || interimTranscript
          setTranscript(fullTranscript)

          if (finalTranscript && onTranscript) {
            onTranscript(finalTranscript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          setIsListening(false)
          onError?.(event.error)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    if (hasSpeechSynthesis) {
      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [onTranscript, onError])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return

    try {
      setTranscript("")
      setIsListening(true)
      recognitionRef.current.start()
    } catch (error) {
      console.error("Error starting speech recognition:", error)
      setIsListening(false)
      onError?.("Erro ao iniciar reconhecimento de voz")
    }
  }, [isSupported, onError])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.stop()
      setIsListening(false)
    } catch (error) {
      console.error("Error stopping speech recognition:", error)
    }
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current || !isSupported || !text.trim()) return

      // Cancel any ongoing speech
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "pt-BR"
      utterance.rate = speechRate
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      setIsSpeaking(true)
      synthRef.current.speak(utterance)
    },
    [isSupported, speechRate],
  )

  const stopSpeaking = useCallback(() => {
    if (!synthRef.current) return

    synthRef.current.cancel()
    setIsSpeaking(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isSpeaking,
    transcript,
    speechRate,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    setSpeechRate,
  }
}
