const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
const SITE_URL = process.env.SITE_URL || "http://localhost:3000"
const SITE_NAME = process.env.SITE_NAME || "Threaded LLM Chat Interface"

export async function POST(req: Request) {
  try {
    // Debug logging
    console.log("Chat API called")
    console.log("API Key exists:", !!OPENROUTER_API_KEY)
    console.log("API Key length:", OPENROUTER_API_KEY?.length || 0)

    if (!OPENROUTER_API_KEY) {
      console.error("Missing OPENROUTER_API_KEY")
      return new Response(
        JSON.stringify({ error: "Missing OPENROUTER_API_KEY – add it to .env.local or your Vercel project." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const body = await req.json()
    console.log("Request body:", JSON.stringify(body, null, 2))

    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages format:", messages)
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("Making request to OpenRouter...")

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant in a threaded chat system. 
You have access to context from multiple conversation threads. 
Provide concise, contextual answers based on the supplied history.
Always respond in a helpful and informative manner.`,
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      }),
    })

    console.log("OpenRouter response status:", response.status)
    console.log("OpenRouter response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenRouter error response:", errorText)

      return new Response(
        JSON.stringify({
          error: `OpenRouter ${response.status} ${response.statusText}`,
          details: errorText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const data = await response.json()
    console.log("OpenRouter success response:", JSON.stringify(data, null, 2))

    const content = data.choices?.[0]?.message?.content ?? "OpenRouter returned no content."

    return new Response(JSON.stringify({ content }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err ?? "Unknown")
    console.error("Chat-route fatal error:", msg)
    console.error("Full error:", err)

    return new Response(JSON.stringify({ error: `Server error: ${msg}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
