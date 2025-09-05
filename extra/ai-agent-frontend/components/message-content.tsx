"use client"
import type { Message } from "@/lib/storage"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { DatabaseResult } from "@/components/database-result"
import { DocumentsResult } from "@/components/documents-result"

interface MessageContentProps {
  message: Message,
  isError: boolean
}

export function MessageContent({ message, isError }: MessageContentProps) {
  const errorText =
    message.intent === "docs"
      ? "Nenhum arquivo válido encontrado no S3 ou leitura está indisponível. Tente novamente mais tarde."
      : message.intent === "db"
      ? "Erro ao executar SQL ou banco de dados está indisponível. Tente novamente mais tarde."
      : "Erro a recuperar mensagem, agente de IA está fora do ar. Tente novamente mais tarde.";

  if (isError) {
    return <MarkdownRenderer content={errorText} />;
  }

  if (message.intent === "db" && message.metadata?.columns && message.metadata?.rows) {
    return (
      <div className="space-y-4">
        <MarkdownRenderer content={message.content} />
        <DatabaseResult
          sql={message.metadata.sql}
          params={message.metadata.params}
          columns={message.metadata.columns}
          rows={message.metadata.rows}
        />
      </div>
    );
  }

  if (message.intent === "docs" && message.metadata?.files) {
    return (
      <div className="space-y-4">
        <MarkdownRenderer content={message.content} />
        <DocumentsResult files={message.metadata.files} />
      </div>
    );
  }

  if (message.intent === "generic") {
    return <MarkdownRenderer content={message.content} />;
  }

  return <MarkdownRenderer content={message.content} />;
}
