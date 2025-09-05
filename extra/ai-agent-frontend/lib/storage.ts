export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  intent?: "generic" | "db" | "docs"
  error?: string
  ok?: boolean
  metadata?: {
    sql?: string
    params?: Record<string, any>
    columns?: string[]
    rows?: any[][]
    files?: string[]
  }
  status?: "pending" | "sent" | "failed"
}

export interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
}

const CONVERSATIONS_KEY = "chat-conversations"
const MESSAGES_KEY = "chat-messages"

export function getConversations(): Conversation[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(CONVERSATIONS_KEY)
  if (!stored) return []

  return JSON.parse(stored).map((conv: any) => ({
    ...conv,
    createdAt: new Date(conv.createdAt),
    updatedAt: new Date(conv.updatedAt),
  }))
}

export function saveConversation(conversation: Conversation): void {
  if (typeof window === "undefined") return

  const conversations = getConversations()
  const index = conversations.findIndex((c) => c.id === conversation.id)

  if (index >= 0) {
    conversations[index] = conversation
  } else {
    conversations.push(conversation)
  }

  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations))
}

export function deleteConversation(id: string): void {
  if (typeof window === "undefined") return

  const conversations = getConversations().filter((c) => c.id !== id)
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations))

  localStorage.removeItem(`${MESSAGES_KEY}-${id}`)
}

export function getMessages(conversationId: string): Message[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(`${MESSAGES_KEY}-${conversationId}`)
  if (!stored) return []

  return JSON.parse(stored).map((msg: any) => ({
    ...msg,
    createdAt: new Date(msg.createdAt),
  }))
}

export function saveMessages(conversationId: string, messages: Message[]): void {
  if (typeof window === "undefined") return

  localStorage.setItem(`${MESSAGES_KEY}-${conversationId}`, JSON.stringify(messages))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
