import { RateLimitError } from "../errors";
import type { TranslateRequest } from "../types";
import { buildPrompt } from "../utils";

export const translateWithGroq = async (
  request: TranslateRequest,
  apiKey: string,
  model: string,
): Promise<string> => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildPrompt(request) }],
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 429) {
      throw new RateLimitError(`Groq rate limit: ${error}`);
    }
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data: {
    choices?: Array<{ message?: { content?: unknown } }>;
  } = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Groq API returned an empty translation");
  }
  return content.trim();
};
