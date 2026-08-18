import { NextRequest, NextResponse } from "next/server";
import { authenticatedFirebaseUid } from "@/lib/server/firebaseAuth";
import { interactionOutputText } from "@/utils/geminiInteraction";

const MODEL = "gemini-3.6-flash";

export async function POST(request: NextRequest) {
  try {
    if (!await authenticatedFirebaseUid(request)) return NextResponse.json({ error: "Your session could not be verified. Please log in again." }, { status: 401 });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Gemini is not configured. Add GEMINI_API_KEY to .env.local and restart the app." }, { status: 503 });
    const body = await request.json() as { question?: unknown; evidence?: unknown };
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 1000) : "";
    if (!question) return NextResponse.json({ error: "Ask a question about your trading." }, { status: 400 });
    const evidenceText = JSON.stringify(body.evidence ?? {}).slice(0, 120_000);
    const prompt = `You are an evidence-based trading journal coach. Analyze behavior and recorded performance, not future market direction. Never give signals, price predictions, or tell the user to buy or sell. Use only the supplied journal evidence. Never invent missing facts. Distinguish correlation from causation. If fewer than 20 closed trades exist, clearly label conclusions preliminary. Every claimed edge or weakness must quote its sample size and a numeric comparison from the evidence. Give a concise answer with these headings: Direct answer, Evidence, Likely causes, Next actions, Confidence. Suggest measurable journaling/process experiments, not financial advice.\n\nUSER QUESTION:\n${question}\n\nJOURNAL EVIDENCE:\n${evidenceText}`;
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": apiKey }, body: JSON.stringify({ model: MODEL, input: prompt, store: false, generation_config: { max_output_tokens: 1400, thinking_level: "low", thinking_summaries: "none" } }), cache: "no-store", signal: AbortSignal.timeout(60_000) });
    const responseText = await response.text();
    let result: { steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } } = {};
    try { result = JSON.parse(responseText) as typeof result; } catch { /* Gemini can return a non-JSON gateway error. */ }
    if (!response.ok) {
      console.error("Gemini coach API error", { status: response.status, model: MODEL, message: result.error?.message ?? responseText.slice(0, 500) });
      return NextResponse.json({ error: result.error?.message || `Gemini request failed (${response.status}). Please try again.` }, { status: response.status });
    }
    const answer = interactionOutputText(result);
    if (!answer) return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 });
    return NextResponse.json({ answer, model: MODEL });
  } catch (error) {
    console.error("Trading coach request failed", error);
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json({ error: timedOut ? "Gemini took too long to respond. Please try again." : "The coach is temporarily unavailable. Check the server console for details." }, { status: timedOut ? 504 : 500 });
  }
}
