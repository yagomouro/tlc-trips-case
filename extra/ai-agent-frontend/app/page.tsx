"use client"
import { useState } from "react"
import { ChatHeader } from "@/components/chat-header"
import { ChatMessages } from "@/components/chat-messages"
import { ChatComposer } from "@/components/chat-composer"
import { ChatSidebar } from "@/components/chat-sidebar"
import { LoadingScreen } from "@/components/loading-screen"
import { useChat } from "@/hooks/use-chat"
import { useSidebar } from "@/hooks/use-sidebar"

export default function ChatPage() {
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const {
    messages,
    isLoading,
    isTyping,
    streamingMessage,
    currentConversation,
    conversations,
    sendMessage,
    createNewChat,
    loadConversation,
    deleteConversation,
    renameConversation,
    retryMessage,
  } = useChat()

  const { isOpen, toggle, close } = useSidebar()

  const handleLoadingComplete = () => {
    setIsInitialLoading(false)
  }

  if (isInitialLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />
  }

  return (
    <div className="flex h-screen bg-background animate-fade-in">
      <ChatSidebar
        isOpen={isOpen}
        onClose={close}
        conversations={conversations}
        currentConversation={currentConversation}
        onNewChat={createNewChat}
        onLoadConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
      />

      <div className="flex flex-col flex-1 min-w-0 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-transparent to-red-50/30 dark:from-red-950/10 dark:via-transparent dark:to-red-950/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          <ChatHeader onToggleSidebar={toggle} onNewChat={createNewChat} />
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            isTyping={isTyping}
            streamingMessage={streamingMessage}
            onSendMessage={sendMessage}
          />
          <ChatComposer onSendMessage={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
