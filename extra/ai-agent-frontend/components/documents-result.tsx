"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ChevronDown, ChevronUp } from "lucide-react"

interface DocumentsResultProps {
  files: string[]
}

export function DocumentsResult({ files }: DocumentsResultProps) {
  const [isExpanded, setIsExpanded] = useState(files.length <= 5)

  const displayFiles = isExpanded ? files : files.slice(0, 5)
  const hasMore = files.length > 5

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground">
          <FileText className="w-4 h-4" />
          Arquivos Consultados ({files.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm text-foreground">
              <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="truncate">{file}</span>
            </div>
          ))}

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-2 text-xs text-foreground hover:bg-muted"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Mostrar mais {files.length - 5} arquivos
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
