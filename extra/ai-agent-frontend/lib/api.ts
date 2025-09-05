export interface ApiResponse {
  ok: boolean
  intent: "generic" | "db" | "docs"
  answer?: string
  error?: string
  sql?: string
  params?: Record<string, any>
  columns?: string[]
  rows?: any[][]
  files?: string[]
}

export async function sendMessage(question: string): Promise<ApiResponse> {
  try {
    // const response = await fetch("https://e3hn74h63j.execute-api.us-east-1.amazonaws.com/prod/ask", {
    const response = await fetch("http://127.0.0.1:5000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      mode: "cors",
      credentials: "omit",
      body: JSON.stringify({
        question,
        metadata: { user: "teste" },
      }),
    })

    console.log(response)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error Response:", errorText)
      return {
        ok: false,
        intent: "generic",
        error: `Erro HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    console.log("API Success Response:", data)
    return { ...data, ok: true }
  } catch (error) {
    console.error("Fetch Error:", error)
    return {
      ok: false,
      intent: "generic",
      error: error instanceof Error ? error.message : "Erro de conexão",
    }
  }
}
