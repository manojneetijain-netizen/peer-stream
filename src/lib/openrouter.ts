const OPENROUTER_API_KEY = import.meta.env.VITE_Open_Router as string;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

export const AGENT_MODELS: Record<string, string> = {
  techWizard: "google/gemini-2.0-flash-001",
  creativeWriter: "anthropic/claude-3-haiku",
  pulseHelper: "google/gemini-2.0-flash-001",
  aiAssistant: "google/gemini-2.0-flash-001",
};

/**
 * Stream a chat completion from OpenRouter.
 * Calls `onChunk` for each streamed text delta, returns the full response.
 */
export async function streamChat(
  messages: ChatMessage[],
  options: OpenRouterOptions = {},
  onChunk?: (chunk: string) => void
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    systemPrompt,
    temperature = 0.7,
    maxTokens = 4096,
  } = options;

  const payload = {
    model,
    messages: [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      ...messages,
    ],
    temperature,
    max_tokens: maxTokens,
    stream: !!onChunk,
  };

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "Pulse Social",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  if (!onChunk) {
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  // Streaming path
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = ""; // carry-over for incomplete SSE lines

  const processText = (text: string) => {
    buffer += text;
    const lines = buffer.split("\n");
    // Keep the last (possibly incomplete) line in the buffer
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") continue;
      try {
        const parsed = JSON.parse(json);
        const delta = parsed.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          full += delta;
          onChunk(delta);
        }
      } catch {
        // ignore malformed chunks
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      // Flush any remaining bytes in the decoder
      const tail = decoder.decode(undefined, { stream: false });
      if (tail) processText(tail);
      break;
    }
    processText(decoder.decode(value, { stream: true }));
  }
  return full;
}

/** Non-streaming convenience wrapper */
export async function chat(
  messages: ChatMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  return streamChat(messages, { ...options, stream: false } as any);
}
