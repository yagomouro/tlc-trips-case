export function exportToCSV(columns: string[], rows: any[][], filename = "query-results.csv"): void {
  const csvContent = [
    columns.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell ?? "")
          return cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")
            ? `"${cellStr.replace(/"/g, '""')}"`
            : cellStr
        })
        .join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
