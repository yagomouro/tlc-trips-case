"use client"
import { useEffect, useRef, useState } from "react"
import type { Message } from "@/lib/storage"
import { MessageBubble } from "@/components/message-bubble"
import { TypingIndicator } from "@/components/typing-indicator"
import { OnboardingCards } from "@/components/onboarding-cards"
import { Bot } from "lucide-react"

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  isTyping?: boolean
  streamingMessage?: Message | null
  onSendMessage?: (message: string) => void
}

export function ChatMessages({
  messages,
  isLoading,
  isTyping = false,
  streamingMessage,
  onSendMessage,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShouldAutoScroll(isNearBottom)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, isTyping, streamingMessage])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const handlePromptSelect = (prompt: string) => {
    if (onSendMessage) {
      onSendMessage(prompt)
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar"
      onScroll={handleScroll}
    >
      {messages.length === 0 && !isTyping ? (
        <div className="flex items-center justify-center h-full animate-fade-in">
          <div className="text-center space-y-8 max-w-4xl w-full">
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl animate-bounce-gentle">
                <Bot className="w-10 h-10 text-white" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent">
                  Bem-vindo ao AiFood!
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Seu assistente inteligente para pesquisar no banco de dados, consultar dados da empresa ou responder
                  perguntas gerais.
                </p>
              </div>
            </div>

            <OnboardingCards onSelectPrompt={handlePromptSelect} />
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div key={message.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
              <MessageBubble message={message} />
            </div>
          ))}

          {isTyping && !streamingMessage && <TypingIndicator showTimeToFirstByte={true} />}

          {streamingMessage && (
            <div className="animate-fade-in">
              <MessageBubble message={streamingMessage} />
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
