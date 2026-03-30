import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SEASONAL_CALENDAR = [
  { month: 1, keywords: "신년 교육 계획, 연간 HRD 로드맵", context: "예산 확정 후 교육 계획 수립 시기" },
  { month: 2, keywords: "신입사원 온보딩, 조직문화 교육", context: "공채 입사 시즌 대비" },
  { month: 3, keywords: "상반기 킥오프, 리더십 워크숍", context: "신년도 사업 시작, 조직 개편" },
  { month: 4, keywords: "법정의무교육, 직무역량 진단", context: "상반기 법정교육 집중 시기" },
  { month: 5, keywords: "중간 점검, 스킬갭 분석", context: "상반기 중간 성과 리뷰" },
  { month: 6, keywords: "상반기 성과 보고, 하반기 교육 기획", context: "상반기 마무리 + 하반기 준비" },
  { month: 7, keywords: "하반기 교육 예산, 디지털 전환 교육", context: "하반기 교육 예산 배정" },
  { month: 8, keywords: "차세대 리더 육성, 승진자 교육", context: "하반기 인사 시즌 대비" },
  { month: 9, keywords: "하반기 킥오프, AX 교육 설계", context: "하반기 사업 가속" },
  { month: 10, keywords: "내년 교육 예산 수립, HRD 트렌드", context: "차년도 예산 편성 시기" },
  { month: 11, keywords: "연말 성과 평가, 교육 ROI 보고", context: "성과 평가 시즌" },
  { month: 12, keywords: "연간 회고, 차년도 HRD 전략", context: "한 해 마무리 + 내년 설계" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const reader = body.reader ?? "HRD 담당자";

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDate = `${now.getFullYear()}년 ${currentMonth}월`;

    const seasonal = SEASONAL_CALENDAR.find((c) => c.month === currentMonth) ??
      SEASONAL_CALENDAR[0];

    const prompt = `당신은 B2B 교육업 전문 콘텐츠 전략가입니다.

[현재 맥락]
- 현재 날짜: ${currentDate}
- 이번 달 시즈널 키워드: ${seasonal.keywords}
- 이번 달 HRD 맥락: ${seasonal.context}

[요청]
위 시즈널 맥락과 최신 HRD/AX 트렌드를 결합하여
지금 이 시점에 ${reader}가 가장 관심을 가질 블로그 주제 5개를 추천해주세요.
반드시 유효한 JSON만 출력하세요. JSON 외의 텍스트는 포함하지 마세요.

[출력 형식 - JSON]
{ "topics": [{ "title": "추천 주제 제목", "reason": "왜 지금 이 주제인지 1줄 설명", "angle": "차별화 포인트", "keywords": ["관련 키워드 2~3개"] }] }`;

    // Use streaming to avoid Vercel serverless timeout
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }],
    });

    let fullText = "";
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullText += event.delta.text;
      }
    }

    // Strip markdown code block if present
    let jsonText = fullText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const parsed = JSON.parse(jsonText);
    return Response.json(parsed);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Topics API error:", errMsg);
    return Response.json(
      { error: `주제 추천 중 오류가 발생했습니다.` },
      { status: 500 }
    );
  }
}
