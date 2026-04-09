"use client";

import { useEffect, useState } from "react";
import SectionHeading from "../../components/SectionHeading";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

export default function AssistantPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [responsePoints, setResponsePoints] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedKey = window.sessionStorage.getItem("clubsphere_groq_api_key") || "";
    setApiKey(storedKey);
  }, []);

  const toPoints = (text) => {
    if (!text) return [];
    const linePoints = text
      .split("\n")
      .map((line) => line.replace(/^[-*•\d.\)\s]+/, "").trim())
      .filter(Boolean);

    if (linePoints.length >= 2) return linePoints;

    return text
      .split(/(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter(Boolean);
  };

  const askAI = async () => {
    if (!user || user.role !== "member") {
      pushToast("AI assistant is available for members only.", "error");
      return;
    }
    if (!prompt.trim()) return;
    const key = apiKey.trim();
    if (!key) {
      setResponsePoints(["Enter your Groq API key in the field above to use the assistant on this static deployment."]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content:
                "You are a concise assistant. Always respond in short bullet points only. No paragraphs."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Groq API error");
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      setResponsePoints(toPoints(text) || ["No response returned from Groq."]);
    } catch (error) {
      setResponsePoints([error.message || "Failed to connect to Groq API."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <SectionHeading
        eyebrow="AI Support"
        title="ClubSphere AI Assistant"
        subtitle="Ask for coding help, project ideas, event themes, or documentation support. On GitHub Pages, the API key is entered at runtime instead of being bundled into the site."
      />
      <div className="glass-card space-y-4 p-6">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => {
            const nextKey = e.target.value;
            setApiKey(nextKey);
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem("clubsphere_groq_api_key", nextKey);
            }
          }}
          placeholder="Paste your Groq API key for this browser session"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
        />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything..."
          className="h-36 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
        />
        <button
          onClick={askAI}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-slate-200">
          {responsePoints.length === 0 ? (
            "AI output appears here."
          ) : (
            <ul className="list-disc space-y-2 pl-5">
              {responsePoints.map((point, index) => (
                <li key={`${point}-${index}`}>{point}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
