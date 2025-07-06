import type { Message } from "@/components/thread-provider"

export async function generateResponse(contextMessages: Message[]): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: contextMessages.map(({ role, content }) => ({
        role,
        content,
      })),
    }),
  })

  if (!res.ok) {
    // Try JSON first …
    let errText = `HTTP ${res.status}`
    try {
      const j = await res.json()
      errText = j.error || JSON.stringify(j)
    } catch {
      errText = await res.text().catch(() => errText)
    }
    throw new Error(`Chat API error: ${errText}`)
  }

  const { content } = (await res.json()) as { content: string }
  return content
}
