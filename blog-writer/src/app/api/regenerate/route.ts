import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TONE_LABELS: Record<string, string> = {
  professional: "전문적·신뢰감",
  friendly: "친근·실용적",
  challenging: "도전적·인사이트형",
};

const READER_LABELS: Record<string, string> = {
  hrd: "HRD 담당자",
  clo: "CLO·교육팀장",
  hrPlanner: "HR 기획자",
  eduOperator: "교육 운영자",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      sectionId,
      title,
      sectionHeadings,
      prevKeyPoint,
      nextKeyPoint,
      currentBody,
      userFeedback,
      tone,
      reader,
    } = body;

    if (!type || !title || !currentBody || !tone || !reader) {
      return Response.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const toneLabel = TONE_LABELS[tone] ?? tone;
    const readerLabel = READER_LABELS[reader] ?? reader;

    let prompt: string;

    if (type === "intro") {
      prompt = `다음 블로그 아티클의 도입부를 다시 작성해주세요.

[아티클 정보]
- 제목: ${title}
- 전체 섹션 구성: ${Array.isArray(sectionHeadings) ? sectionHeadings.join(", ") : sectionHeadings ?? ""}
- 톤: ${toneLabel}
- 타겟 독자: ${readerLabel}

[현재 도입부]
${currentBody}
${userFeedback ? `\n[수정 요청]\n${userFeedback}` : ""}

반드시 유효한 JSON만 출력하세요. JSON 외의 텍스트는 포함하지 마세요.

[출력 형식 - JSON]
{ "intro": "새로 작성된 도입부 (3~4문장)" }`;
    } else if (type === "outro") {
      prompt = `다음 블로그 아티클의 마무리를 다시 작성해주세요.

[아티클 정보]
- 제목: ${title}
- 전체 섹션 구성: ${Array.isArray(sectionHeadings) ? sectionHeadings.join(", ") : sectionHeadings ?? ""}
- 톤: ${toneLabel}
- 타겟 독자: ${readerLabel}

[현재 마무리]
${currentBody}
${userFeedback ? `\n[수정 요청]\n${userFeedback}` : ""}

반드시 유효한 JSON만 출력하세요. JSON 외의 텍스트는 포함하지 마세요.

[출력 형식 - JSON]
{ "outro": "새로 작성된 마무리 (2~3문장)" }`;
    } else {
      // type === "section"
      prompt = `다음 블로그 섹션을 다시 작성해주세요.

[아티클 정보]
- 제목: ${title}
- 섹션 ID: ${sectionId ?? ""}
- 톤: ${toneLabel}
- 타겟 독자: ${readerLabel}
${prevKeyPoint ? `- 이전 섹션 핵심 메시지: ${prevKeyPoint}` : ""}
${nextKeyPoint ? `- 다음 섹션 핵심 메시지: ${nextKeyPoint}` : ""}

[현재 섹션 본문]
${currentBody}
${userFeedback ? `\n[수정 요청]\n${userFeedback}` : ""}

반드시 유효한 JSON만 출력하세요. JSON 외의 텍스트는 포함하지 마세요.

[출력 형식 - JSON]
{
  "heading": "질문형 소제목",
  "directAnswer": "소제목 질문에 대한 직접 답변 1~2문장",
  "body": "새로 작성된 본문 (마크다운 지원)",
  "keyPoint": "핵심 메시지 1문장"
}`;
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 2048,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "예상치 못한 응답 형식입니다." },
        { status: 500 }
      );
    }

    let parsed: unknown;
    try {
      let jsonText = content.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      parsed = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: "JSON 파싱에 실패했습니다.", raw: content.text },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Regenerate API error:", error);
    return NextResponse.json(
      { error: "섹션 재생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
