"use client"
import { Button } from "@/components/ui/button"
import { Menu, Plus, Bot } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface ChatHeaderProps {
  onToggleSidebar: () => void
  onNewChat: () => void
}

export function ChatHeader({ onToggleSidebar, onNewChat }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border glass-effect sticky top-0 z-40 animate-slide-up">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="lg:hidden hover-lift hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent">
            AiFood
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onNewChat}
          size="sm"
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl hover-lift transition-all duration-300 group"
        >
          <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Novo Chat
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
