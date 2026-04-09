import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

export async function POST(request) {
  try {
    const body = await request.json();
    const prompt = body?.prompt?.trim() || "";

    if (!prompt) {
      return NextResponse.json({ success: false, message: "Prompt is required." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Groq API key is missing on server. Set GROQ_API_KEY in deployment environment variables."
        },
        { status: 500 }
      );
    }

    const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a concise assistant. Always respond in short bullet points only. No paragraphs."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const raw = await groqResponse.text();
    let data = {};
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }

    if (!groqResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.error?.message || raw || "Groq API request failed."
        },
        { status: groqResponse.status || 500 }
      );
    }

    const text = data?.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ success: true, text });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to process assistant request." },
      { status: 500 }
    );
  }
}
