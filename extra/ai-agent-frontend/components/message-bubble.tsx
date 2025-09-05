"use client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import type { Message } from "@/lib/storage"
import { MessageContent } from "@/components/message-content"
import { cn } from "@/lib/utils"
import { User, Bot, AlertCircle, Clock, MessageSquare, Database, FileText } from "lucide-react"

interface MessageBubbleProps {
  message: Message
}

function getMessageTypeInfo(intent?: string) {
  switch (intent) {
    case "db":
      return {
        label: "Dados",
        icon: Database,
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800",
        textColor: "text-blue-700 dark:text-blue-300",
        iconColor: "text-blue-600 dark:text-blue-400",
      }
    case "docs":
      return {
        label: "Documentos",
        icon: FileText,
        bgColor: "bg-green-50 dark:bg-green-950/30",
        borderColor: "border-green-200 dark:border-green-800",
        textColor: "text-green-700 dark:text-green-300",
        iconColor: "text-green-600 dark:text-green-400",
      }
    default:
      return {
        label: "Genérico",
        icon: MessageSquare,
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
        borderColor: "border-orange-200 dark:border-orange-800",
        textColor: "text-orange-700 dark:text-orange-300",
        iconColor: "text-orange-600 dark:text-orange-400",
      }
  }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"
  const isError = message.content == 'Error'

  const typeInfo = !isUser ? getMessageTypeInfo(message?.intent) : null

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className={cn("w-8 h-8 shrink-0", isUser ? "bg-[#ea1d2c]" : "bg-muted")}>
        <AvatarFallback className={cn(isUser ? "text-white" : "text-foreground")}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col gap-1 max-w-[80%]", isUser ? "items-end" : "items-start")}>
        {!isUser && typeInfo && (
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-b transition-all duration-200",
              typeInfo.bgColor,
              typeInfo.borderColor,
              typeInfo.textColor,
            )}
          >
            <typeInfo.icon className={cn("w-3.5 h-3.5", typeInfo.iconColor)} />
            <span className="text-xs font-medium">{typeInfo.label}</span>
          </div>
        )}

        <Card
          className={cn(
            "p-4 shadow-sm border-2 transition-all duration-200",
            !isUser && typeInfo ? "rounded-t-none" : "",
            isUser
              ? "bg-[#ea1d2c] text-white border-[#ea1d2c]/20"
              : isError
                ? "bg-destructive/10 border-destructive/20 text-destructive-foreground"
                : "bg-card text-card-foreground border-border hover:shadow-md",
          )}
        >
          <MessageContent message={message} isError={isError} />
        </Card>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {message.status === "pending" && (
            <>
              <Clock className="w-3 h-3" />
              <span>Enviando...</span>
            </>
          )}
          {message.status === "failed" && (
            <>
              <AlertCircle className="w-3 h-3 text-destructive" />
              <span className="text-destructive">Falha no envio</span>
            </>
          )}
          <time>{message.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>
        </div>
      </div>
    </div>
  )
}
