"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, Database } from "lucide-react"
import { exportToCSV } from "@/lib/csv-export"

interface DatabaseResultProps {
  sql?: string
  params?: Record<string, any>
  columns: string[]
  rows: any[][]
}

export function DatabaseResult({ sql, params, columns, rows }: DatabaseResultProps) {
  const handleDownloadCSV = () => {
    exportToCSV(columns, rows, "query-results.csv")
  }

  return (
    <div className="space-y-4">
      {sql && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Database className="w-4 h-4" />
              Consulta SQL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto text-foreground">{sql}</pre>
            {params && Object.keys(params).length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Parâmetros:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(params).map(([key, value]) => (
                    <span key={key} className="bg-muted px-2 py-1 rounded text-xs text-foreground">
                      <span className="font-medium">{key}:</span> {String(value)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-foreground">
              Resultados ({rows.length} {rows.length === 1 ? "linha" : "linhas"})
            </CardTitle>
            {rows.length > 0 && (
              <Button onClick={handleDownloadCSV} size="sm" variant="outline" className="text-xs bg-transparent">
                <Download className="w-3 h-3 mr-1" />
                CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum resultado encontrado.</p>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {columns.map((column) => (
                        <th key={column} className="text-left p-2 font-medium text-foreground">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-border/50 hover:bg-muted/50">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="p-2 text-foreground">
                            {cell === null || cell === undefined ? (
                              <span className="text-muted-foreground italic">null</span>
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
