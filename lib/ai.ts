import type { Message } from "@/components/thread-provider"

export async function generateResponse(
  contextMessages: Array<{ role: "user" | "assistant"; content: string }>, 
  onChunk?: (chunk: string) => void,
  showThinkingMode?: boolean,
  temperature?: number,
  maxTokens?: number
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: contextMessages.map(({ role, content }) => ({
        role,
        content,
      })),
      showThinkingMode,
      temperature,
      maxTokens,
    }),
  })

  if (!res.ok) {
    let errText = `HTTP ${res.status}`
    try {
      const j = await res.json()
      errText = j.error || JSON.stringify(j)
    } catch {
      errText = await res.text().catch(() => errText)
    }
    throw new Error(`Chat API error: ${errText}`)
  }

  if (!res.body) {
    throw new Error("No response body")
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.content) {
              fullContent += data.content
              onChunk?.(data.content)
            }
          } catch (e) {
            console.error("Frontend JSON parsing error:", e)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  console.log("Response completed, length:", fullContent.length)
  
  if (!fullContent || fullContent.trim() === '') {
    throw new Error("Received empty response from AI")
  }
  
  return fullContent
}
