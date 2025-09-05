"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Conversation } from "@/lib/storage"
import { ConversationItem } from "@/components/conversation-item"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  conversations: Conversation[]
  currentConversation: Conversation | null
  onNewChat: () => void
  onLoadConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, title: string) => void
}

export function ChatSidebar({
  isOpen,
  onClose,
  conversations,
  currentConversation,
  onNewChat,
  onLoadConversation,
  onDeleteConversation,
  onRenameConversation,
}: ChatSidebarProps) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Conversas</h2>
            <div className="flex items-center gap-2">
              <Button onClick={onNewChat} size="sm" variant="ghost" className="text-[#ea1d2c] hover:bg-[#ea1d2c]/10">
                <Plus className="h-4 w-4" />
              </Button>
              <Button onClick={onClose} size="sm" variant="ghost" className="lg:hidden">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhuma conversa ainda</p>
                  <p className="text-xs mt-1">Inicie um novo chat para começar</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={currentConversation?.id === conversation.id}
                    onSelect={() => onLoadConversation(conversation.id)}
                    onDelete={() => onDeleteConversation(conversation.id)}
                    onRename={(title) => onRenameConversation(conversation.id, title)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>
    </>
  )
}
