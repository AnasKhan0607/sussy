import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { rateLimit } from "@/lib/rateLimiter";

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { success, resetIn } = rateLimit(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests — please try again later", retryAfter: resetIn },
      { status: 429, headers: { "Retry-After": String(resetIn) } }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    );
  }

  let topic: string;
  try {
    const body = await req.json();
    topic = body.topic?.trim();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!topic || topic.length > 100) {
    return NextResponse.json(
      { error: "Topic is required and must be under 100 characters" },
      { status: 400 }
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You generate word lists for a party game called "Imposter". Players each receive a secret word from a category — except the imposter, who must bluff.

Given a topic, produce exactly 15 words related to that topic:
- 5 easy (common, well-known)
- 5 medium (moderately known)
- 5 hard (obscure or niche)

Each word must have a short hint (a vague clue that helps the imposter blend in without giving the word away).

Respond with ONLY valid JSON, no markdown fences. Use this exact shape:
{
  "category": "<topic>",
  "emoji": "<single relevant emoji>",
  "words": {
    "easy": [{ "word": "...", "hint": "..." }, ...],
    "medium": [{ "word": "...", "hint": "..." }, ...],
    "hard": [{ "word": "...", "hint": "..." }, ...]
  }
}`,
        },
        {
          role: "user",
          content: `Topic: ${topic}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 502 }
      );
    }

    const data = JSON.parse(raw);

    // Validate structure
    const { words } = data;
    if (
      !words?.easy?.length ||
      !words?.medium?.length ||
      !words?.hard?.length
    ) {
      return NextResponse.json(
        { error: "AI returned an invalid word structure" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof OpenAI.APIError) {
      if (err.status === 429) {
        return NextResponse.json(
          { error: "Rate limited — please try again in a moment" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "AI service error" },
        { status: 502 }
      );
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI returned invalid JSON — try again" },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Unexpected error generating words" },
      { status: 500 }
    );
  }
}
