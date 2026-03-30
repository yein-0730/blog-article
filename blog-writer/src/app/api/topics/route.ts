import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SEASONAL_CALENDAR = [
  { month: 1, keywords: "연간 LMS 운영 계획, AI 기반 교육 로드맵, 역량진단 시스템 도입", context: "예산 확정 후 온라인 교육 플랫폼·진단 도구 도입 계획 수립 시기" },
  { month: 2, keywords: "신입사원 온보딩 LMS 설계, 생성형 AI 활용 온보딩 콘텐츠", context: "공채 시즌 대비 온라인 온보딩 과정 구축" },
  { month: 3, keywords: "상반기 온라인 교육과정 개편, LMS 콘텐츠 큐레이션, AI 튜터 도입", context: "신년도 사업 시작, 디지털 교육 인프라 점검" },
  { month: 4, keywords: "법정의무교육 온라인 전환, 직무역량 진단 시스템 운영", context: "상반기 법정교육 온라인 운영 집중 시기" },
  { month: 5, keywords: "LMS 데이터 분석, AI 기반 스킬갭 진단, 학습 성과 대시보드", context: "상반기 중간 점검, 학습 데이터 기반 성과 분석" },
  { month: 6, keywords: "하반기 이러닝 기획, 생성형 AI 교육 콘텐츠 제작, LMS 고도화", context: "상반기 마무리 + 하반기 디지털 교육 전략 수립" },
  { month: 7, keywords: "하반기 교육 예산, 마이크로러닝 설계, AI 학습 추천 시스템", context: "하반기 온라인 교육 예산 배정 및 신규 기능 도입" },
  { month: 8, keywords: "AI 역량진단 고도화, 적응형 학습 설계, LMS 사용자 경험 개선", context: "하반기 디지털 교육 인프라 업그레이드" },
  { month: 9, keywords: "생성형 AI 교육 트렌드, AX 교육 설계, 온라인 블렌디드 러닝", context: "하반기 사업 가속, AI 전환 교육 본격화" },
  { month: 10, keywords: "내년 LMS 예산 수립, 교육 테크 트렌드, AI 진단 도구 ROI", context: "차년도 에듀테크 예산 편성 시기" },
  { month: 11, keywords: "온라인 교육 성과 평가, LMS 운영 ROI 보고, AI 교육 효과 분석", context: "연간 디지털 교육 성과 평가 시즌" },
  { month: 12, keywords: "연간 LMS 운영 회고, 차년도 에듀테크 전략, 생성형 AI 교육 계획", context: "한 해 마무리 + 내년 디지털 교육 전략 설계" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const reader = body.reader ?? "HRD 담당자";
    const previousTopics: string[] = body.previousTopics ?? [];

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDate = `${now.getFullYear()}년 ${currentMonth}월`;

    const seasonal = SEASONAL_CALENDAR.find((c) => c.month === currentMonth) ??
      SEASONAL_CALENDAR[0];

    // Pick a random focus angle each time for variety
    const ANGLES = [
      "실무 담당자가 바로 적용할 수 있는 실전 가이드 관점",
      "최신 트렌드와 기술 변화에 초점을 맞춘 관점",
      "비용 절감과 ROI 극대화 관점",
      "도입 사례와 비교 분석 관점",
      "문제 해결과 트러블슈팅 관점",
      "미래 전망과 전략 수립 관점",
      "데이터 분석과 성과 측정 관점",
    ];
    const randomAngle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

    const excludeBlock = previousTopics.length > 0
      ? `\n[제외 주제]\n이전에 이미 추천한 주제입니다. 반드시 이와 다른 새로운 주제를 추천하세요:\n${previousTopics.map((t) => `- ${t}`).join("\n")}\n`
      : "";

    const prompt = `당신은 B2B 교육업 전문 콘텐츠 전략가입니다.

[현재 맥락]
- 현재 날짜: ${currentDate}
- 이번 달 시즈널 키워드: ${seasonal.keywords}
- 이번 달 HRD 맥락: ${seasonal.context}

[필수 카테고리]
반드시 아래 카테고리 중심으로 주제를 추천하세요:
- 온라인 교육 / 이러닝 / 마이크로러닝
- LMS(학습관리시스템) 운영·도입·고도화
- 역량진단 / 스킬갭 분석 / 진단 시스템
- 생성형 AI 활용 교육 / AI 기반 학습 설계 / AX(AI Transformation)
- AI 교육과정 설계 (AI 리터러시, 프롬프트 엔지니어링, AI 도구 활용법 등 구성원 대상 AI 역량 교육)
- AI 시대 교육 트렌드 (AI 튜터, 적응형 학습, AI 코칭, 자동 콘텐츠 생성 등)
※ 리더십, 소프트스킬, 조직문화 같은 일반 HR 주제는 제외하세요.
${excludeBlock}
[이번 추천의 관점]
이번에는 "${randomAngle}"으로 주제를 구성하세요.

[요청]
위 시즈널 맥락과 필수 카테고리를 결합하여
지금 이 시점에 ${reader}가 가장 관심을 가질 블로그 주제 5개를 추천해주세요.
이전 추천과 겹치지 않는 완전히 새로운 주제여야 합니다.

[형식 다양성 규칙]
- "A vs B" 비교 형식은 5개 중 최대 1개만 허용합니다.
- 다양한 형식을 섞어주세요: 가이드형("~하는 방법"), 리스트형("~ 5가지"), 트렌드형("2026년 ~"), 사례형("~ 성공 사례"), 인사이트형("왜 ~인가"), 체크리스트형("~ 전 반드시 확인할 ~") 등

반드시 유효한 JSON만 출력하세요. JSON 외의 텍스트는 포함하지 마세요.

[출력 형식 - JSON]
{ "topics": [{ "title": "추천 주제 제목", "reason": "왜 지금 이 주제인지 1줄 설명", "angle": "차별화 포인트", "keywords": ["관련 키워드 2~3개"] }] }`;

    // Use streaming to avoid Vercel serverless timeout
    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
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
