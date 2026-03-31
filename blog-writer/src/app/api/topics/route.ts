import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SEASONAL_KEYWORDS: Record<number, string> = {
  1: "연간 LMS 운영 계획, 생성형 AI 교육 로드맵",
  2: "온보딩 LMS 설계, 생성형 AI 활용 콘텐츠 제작",
  3: "교육과정 개편, LMS 큐레이션, 생성형 AI 교육 설계",
  4: "법정의무교육 온라인 전환, 생성형 AI 콘텐츠 자동화",
  5: "LMS 데이터 분석, 학습 대시보드, 생성형 AI 교육 효과 측정",
  6: "이러닝 기획, 생성형 AI 콘텐츠 제작, LMS 고도화",
  7: "마이크로러닝 설계, 생성형 AI 활용 교육과정 개발",
  8: "생성형 AI 교육 설계 고도화, LMS UX 개선",
  9: "생성형 AI 교육 트렌드, AX 교육 설계, 블렌디드 러닝",
  10: "LMS 예산 수립, 에듀테크 트렌드, 생성형 AI 교육 ROI",
  11: "교육 성과 평가, LMS ROI, 생성형 AI 교육 효과 분석",
  12: "LMS 운영 회고, 에듀테크 전략, 생성형 AI 교육 계획",
};

const ANGLES = [
  "실전 가이드", "최신 트렌드", "ROI·비용 절감",
  "도입 사례·비교", "문제 해결", "미래 전망", "성과 측정",
];

const TOPICS_TOOL: Anthropic.Tool = {
  name: "save_topics",
  description: "블로그 주제 추천 결과를 저장합니다",
  input_schema: {
    type: "object",
    properties: {
      topics: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            reason: { type: "string", description: "왜 지금 이 주제인지 1줄 설명" },
            angle: { type: "string", description: "이 주제가 다루는 핵심 내용을 1줄로 요약 (형식 태그 금지: '가이드형', '사례형' 등 쓰지 말 것)" },
            keywords: { type: "array", items: { type: "string" } },
          },
          required: ["title", "reason", "angle", "keywords"],
        },
      },
    },
    required: ["topics"],
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const reader = body.reader ?? "HRD 담당자";
    const previousTopics: string[] = body.previousTopics ?? [];

    const month = new Date().getMonth() + 1;
    const seasonal = SEASONAL_KEYWORDS[month] ?? SEASONAL_KEYWORDS[1];
    const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

    const exclude = previousTopics.length > 0
      ? `\n제외: ${previousTopics.join(", ")}`
      : "";

    const year = new Date().getFullYear();

    const prompt = `B2B 교육업 블로그 주제 5개를 추천하세요.

현재: ${year}년 ${month}월
시즈널 키워드: ${seasonal}
관점: ${angle}
독자: ${reader}${exclude}

카테고리: 이러닝/마이크로러닝, LMS 운영·도입, 생성형 AI 교육 설계, AI 역량 교육과정 설계, AX 교육 전략
제외: AI 튜터, AI 코칭, 적응형 학습, AI 진단, 리더십, 소프트스킬
제목 형식을 다양하게 섞어주세요: "~하는 방법", "~ 5가지", "${year}년 ~", "왜 ~인가" 등. "A vs B" 비교는 최대 1개.
angle 필드에는 '가이드형', '사례형' 같은 형식 태그 대신, 이 글이 구체적으로 어떤 내용을 다루는지 한 줄로 설명하세요.
중요: 연도를 언급할 때 반드시 ${year}년을 사용하세요.`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      temperature: 0.8,
      tools: [TOPICS_TOOL],
      tool_choice: { type: "tool", name: "save_topics" },
      messages: [{ role: "user", content: prompt }],
    });

    const block = response.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") {
      throw new Error("주제 생성 실패");
    }

    const result = block.input as { topics?: unknown[] };
    if (result.topics && result.topics.length > 0) {
      return Response.json(result);
    }

    // Fallback: if tool_use returned empty, try plain text
    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      let jsonText = textBlock.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      const parsed = JSON.parse(jsonText);
      if (parsed.topics?.length > 0) return Response.json(parsed);
    }

    throw new Error("주제 생성 결과가 비어있습니다");
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Topics API error:", errMsg);
    return Response.json(
      { error: `주제 추천 중 오류가 발생했습니다.` },
      { status: 500 }
    );
  }
}
