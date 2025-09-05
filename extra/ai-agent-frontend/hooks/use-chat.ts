"use client"
import { useState, useEffect } from "react"
import {
  type Message,
  type Conversation,
  generateId,
  getConversations,
  saveConversation,
  deleteConversation as deleteConversationStorage,
  getMessages,
  saveMessages,
} from "@/lib/storage"
import { sendMessage as apiSendMessage } from "@/lib/api"

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null)

  useEffect(() => {
    const loadedConversations = getConversations()
    setConversations(loadedConversations)

    if (loadedConversations.length > 0) {
      const latest = loadedConversations[0]
      setCurrentConversation(latest)
      setMessages(getMessages(latest.id))
    }
  }, [])

  const createNewChat = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: "Nova Conversa",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setCurrentConversation(newConversation)
    setMessages([])
    saveConversation(newConversation)
    setConversations((prev) => [newConversation, ...prev])
  }

  const loadConversation = (id: string) => {
    const conversation = conversations.find((c) => c.id === id)
    if (conversation) {
      setCurrentConversation(conversation)
      setMessages(getMessages(id))
    }
  }

  const deleteConversation = (id: string) => {
    deleteConversationStorage(id)
    setConversations((prev) => prev.filter((c) => c.id !== id))

    if (currentConversation?.id === id) {
      const remaining = conversations.filter((c) => c.id !== id)
      if (remaining.length > 0) {
        loadConversation(remaining[0].id)
      } else {
        createNewChat()
      }
    }
  }

  const renameConversation = (id: string, title: string) => {
    const conversation = conversations.find((c) => c.id === id)
    if (conversation) {
      const updated = { ...conversation, title, updatedAt: new Date() }
      saveConversation(updated)
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)))
      if (currentConversation?.id === id) {
        setCurrentConversation(updated)
      }
    }
  }

  const sendMessage = async (content: string) => {
    if (!currentConversation) {
      createNewChat()
      return
    }

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      createdAt: new Date(),
      status: "pending",
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await apiSendMessage(content)

      setIsTyping(false)

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: response.ok ? response.answer || "" : response.error || "Erro desconhecido",
        createdAt: new Date(),
        intent: response.intent,
        metadata: response.ok
          ? {
              sql: response.sql,
              params: response.params,
              columns: response.columns,
              rows: response.rows,
              files: response.files,
            }
          : undefined,
      }

      if (response.ok && response.answer) {
        await simulateTypingReveal(assistantMessage, updatedMessages, userMessage)
      } else {
        // For errors, show immediately
        const finalMessages = [
          ...updatedMessages.map((m) => (m.id === userMessage.id ? { ...m, status: "sent" as const } : m)),
          assistantMessage,
        ]
        setMessages(finalMessages)
        saveMessages(currentConversation.id, finalMessages)
      }

      if (currentConversation.title === "Nova Conversa" && content.length > 0) {
        const newTitle = content.length > 50 ? content.substring(0, 50) + "..." : content
        renameConversation(currentConversation.id, newTitle)
      }
    } catch (error) {
      setIsTyping(false)
      setStreamingMessage(null)

      const failedMessages = updatedMessages.map((m) =>
        m.id === userMessage.id ? { ...m, status: "failed" as const } : m,
      )
      setMessages(failedMessages)
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const simulateTypingReveal = async (assistantMessage: Message, updatedMessages: Message[], userMessage: Message) => {
    const fullText = assistantMessage.content
    const words = fullText.split(" ")
    const wordsPerChunk = Math.max(1, Math.floor(words.length / 10)) // Reveal in ~10 chunks

    // Start with empty content
    const streamingMsg = { ...assistantMessage, content: "" }
    setStreamingMessage(streamingMsg)

    const baseMessages = [
      ...updatedMessages.map((m) => (m.id === userMessage.id ? { ...m, status: "sent" as const } : m)),
    ]

    setMessages([...baseMessages, streamingMsg])

    // Gradually reveal text
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      const chunk = words.slice(0, i + wordsPerChunk).join(" ")
      const updatedStreamingMsg = { ...assistantMessage, content: chunk }

      setStreamingMessage(updatedStreamingMsg)
      setMessages([...baseMessages, updatedStreamingMsg])

      // Small delay between chunks for smooth reveal
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    // Final message with complete content
    const finalMessages = [...baseMessages, assistantMessage]
    setMessages(finalMessages)
    setStreamingMessage(null)
    saveMessages(currentConversation!.id, finalMessages)
  }

  const retryMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex === -1) return

    const userMessage = messages[messageIndex - 1] // Get the user message before the failed one
    if (userMessage?.role === "user") {
      // Remove the failed message and retry
      const messagesWithoutFailed = messages.slice(0, messageIndex)
      setMessages(messagesWithoutFailed)
      await sendMessage(userMessage.content)
    }
  }

  return {
    messages,
    conversations,
    currentConversation,
    isLoading,
    isTyping,
    streamingMessage,
    sendMessage,
    createNewChat,
    loadConversation,
    deleteConversation,
    renameConversation,
    retryMessage,
  }
}
