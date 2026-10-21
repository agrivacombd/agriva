import { NextRequest, NextResponse } from "next/server";
import { answerAgricultureQuestion } from "@/lib/ai/respond";
import { detectIntent } from "@/lib/ai/intent";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    if (!question) return NextResponse.json({ error: "প্রশ্ন লিখুন।" }, { status: 400 });
    if (question.length > 2000) return NextResponse.json({ error: "প্রশ্নটি ২০০০ অক্ষরের মধ্যে রাখুন।" }, { status: 400 });

    const intent = detectIntent(question);
    const result = await answerAgricultureQuestion(question, intent);
    return NextResponse.json({ question, intent, ...result, aiConfigured: result.source === "gemini" || result.source === "openai" });
  } catch (error) {
    console.error("AGRIVA AI route failed:", error);
    return NextResponse.json({
      error: "উত্তর তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      detail: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
    }, { status: 500 });
  }
}
