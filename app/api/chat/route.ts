const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
const SITE_URL = process.env.SITE_URL || "http://localhost:3000"
const SITE_NAME = process.env.SITE_NAME || "Threaded LLM Chat Interface"

export async function POST(req: Request) {
  try {
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

    const { messages, showThinkingMode, temperature = 0.3, maxTokens = 8000 } = body
    
    console.log(`Sending ${messages.length} messages to LLM`)
    if (messages.length > 0) {
      console.log("First message:", messages[0])
      console.log("Last message:", messages[messages.length - 1])
    }
    
    const userMessages = messages.filter((m: any) => m.role === 'user')
    const assistantMessages = messages.filter((m: any) => m.role === 'assistant')
    console.log(`Context breakdown: ${userMessages.length} user messages, ${assistantMessages.length} assistant messages`)
    
    if (messages.length > 10) {
      console.log("⚠️ WARNING: Large context detected, this might cause issues")
    }

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
            content: showThinkingMode 
              ? `You are a helpful AI assistant in a threaded chat system. 

IMPORTANT INSTRUCTIONS:
- Be conversational and friendly
- ALWAYS show your thinking process step by step for any question
- Use phrases like "Let me think about this..." or "Here's my reasoning..." when working through problems
- For mathematical or logical problems, break down your solution clearly
- Show your step-by-step reasoning even for simple questions
- Answer questions directly and accurately
- Use context from previous messages when relevant
- Keep responses concise and to the point
- If you're unsure about something, say so rather than guessing
- Always provide a complete, meaningful response

You have access to context from multiple conversation threads. Provide helpful, accurate answers based on the user's questions and the conversation history.`
              : `You are a helpful AI assistant in a threaded chat system. 

IMPORTANT INSTRUCTIONS:
- Be conversational and friendly
- For complex questions, show your thinking process step by step
- Use phrases like "Let me think about this..." or "Here's my reasoning..." when working through problems
- For mathematical or logical problems, break down your solution clearly
- Answer questions directly and accurately
- Use context from previous messages when relevant
- If you're unsure about something, say so rather than guessing
- Always provide a complete, meaningful response

You have access to context from multiple conversation threads. Provide helpful, accurate answers based on the user's questions and the conversation history.`,
          },
          ...messages,
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        stream: true,
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

    if (!response.body) {
      throw new Error("No response body")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  controller.close()
                  return
                }

                if (!data.trim()) continue

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    const content = parsed.choices[0].delta.content
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // Silently ignore parsing errors for streaming data
                  // This is normal for incomplete JSON chunks
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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
