"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<number>>(new Set())

  const copyToClipboard = async (text: string, blockIndex: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedBlocks((prev) => new Set(prev).add(blockIndex))
      setTimeout(() => {
        setCopiedBlocks((prev) => {
          const newSet = new Set(prev)
          newSet.delete(blockIndex)
          return newSet
        })
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const renderContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g)
    let blockIndex = 0

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const code = part.slice(3, -3).trim()
        const lines = code.split("\n")
        const language = lines[0]
        const codeContent = lines.slice(1).join("\n")
        const currentBlockIndex = blockIndex++

        return (
          <div key={index} className="relative group my-4">
            <div className="bg-muted rounded-lg border">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground">{language || "code"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(codeContent, currentBlockIndex)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copiedBlocks.has(currentBlockIndex) ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm font-mono">{codeContent}</code>
              </pre>
            </div>
          </div>
        )
      }

      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={index} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
            {part.slice(1, -1)}
          </code>
        )
      }

      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        )
      }

      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={index} className="italic">
            {part.slice(1, -1)}
          </em>
        )
      }

      return part.split("\n").map((line, lineIndex, lines) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ))
    })
  }

  return <div className="prose prose-sm max-w-none text-inherit">{renderContent(content)}</div>
}
