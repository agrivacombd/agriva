import { NextRequest, NextResponse } from "next/server";
import { answerAgricultureQuestion } from "@/lib/ai/respond";
import { detectIntent } from "@/lib/ai/intent";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "প্রশ্ন লিখুন।" }, { status: 400 });
  if (question.length > 2000) return NextResponse.json({ error: "প্রশ্নটি ২০০০ অক্ষরের মধ্যে রাখুন।" }, { status: 400 });

  const intent = detectIntent(question);
  const result = await answerAgricultureQuestion(question, intent);
  return NextResponse.json({ question, intent, ...result, aiConfigured: result.source === "openai" });
}
