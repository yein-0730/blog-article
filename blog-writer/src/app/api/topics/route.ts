import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface MonthlyHRDContext {
  events: string;
  painPoints: string;
  lmsHook: string;
  skillHook: string;
  axHook: string;
  banner: string;
}

const HRD_CALENDAR: Record<number, MonthlyHRDContext> = {
  1: {
    events: "연간 교육 계획 실행 개시, 법정의무교육 연간 이수 시계 시작, LMS/벤더 계약 확정, 예산 집행 시작",
    painPoints: "승인된 예산을 빠르게 집행해야 하는 압박, 재무팀 승인 지연으로 1월 일정 압축",
    lmsHook: "새해 LMS 운영 계획을 세우고 연간 교육 로드맵을 LMS에 셋업하는 시기",
    skillHook: "연초 조직 역량 진단으로 올해 교육 우선순위를 데이터 기반으로 결정해야 하는 시기",
    axHook: "AI 교육 연간 로드맵 확정 시기 — 어떤 직무부터, 어떤 수준으로 AI 리터러시를 높일지 설계",
    banner: "연간 교육 계획 실행 · LMS 운영 셋업 · AI 교육 로드맵 확정",
  },
  2: {
    events: "상반기 공채 시작(현대·LG·롯데 등), 신입사원 온보딩 커리큘럼 설계, 성희롱 예방교육 조기 실시 시작",
    painPoints: "채용 공고와 동시에 온보딩 프로그램을 설계해야 하는 2개월 압축 일정",
    lmsHook: "신입사원 온보딩을 LMS 기반 블렌디드 러닝으로 설계하는 시기 — 사전 이러닝 + 현장 OJT 조합",
    skillHook: "신입사원 기초 역량 진단 설계 — 입사 전 사전 진단으로 맞춤 온보딩 경로 설정",
    axHook: "MZ세대 신입사원 대상 AI 툴 활용 교육 설계 — ChatGPT/Copilot 등 실무 도구 중심",
    banner: "상반기 공채 시작 · 신입사원 온보딩 설계 · MZ세대 AI 교육",
  },
  3: {
    events: "상반기 공채 피크(삼성·SK 등), 산업안전보건교육 H1 시작(6/30 마감), 신임 관리자 승진 교육 개시, TNA 결과 반영",
    painPoints: "채용·안전교육·승진교육이 동시에 몰리는 가장 바쁜 시기, 다수 사업장 안전교육 조율 난이도",
    lmsHook: "법정의무교육(산업안전보건)을 LMS로 효율화 — 사업장별 이수 현황 실시간 추적",
    skillHook: "신임 팀장/관리자 리더십 역량 진단 — 승진자 대상 강점·약점 파악 후 맞춤 교육 설계",
    axHook: "신입사원 AX 교육 본격 시작 — AI 시대 필수 디지털 역량 온보딩에 포함",
    banner: "공채 피크 · 산업안전교육 시작 · 신임 관리자 교육",
  },
  4: {
    events: "HRD KOREA 컨퍼런스(COEX), 장애인 인식개선·개인정보보호 교육 실시, LMS 벤더 탐색 RFP 시작(Q1-Q2), 임원 리더십 교육",
    painPoints: "컨퍼런스 시즌으로 HRD 담당자 부재 중 운영 프로그램 관리, 벤더 미팅이 몰려 의사결정 피로",
    lmsHook: "LMS 교체/도입 검토 시작 — 현 플랫폼 한계 점검, RFP 작성 체크리스트",
    skillHook: "HRD KOREA에서 발견한 트렌드를 우리 조직 역량 체계에 어떻게 적용할지 설계",
    axHook: "컨퍼런스에서 확인한 AI 교육 트렌드 — 경쟁사는 이미 AX 교육을 어떻게 하고 있는지",
    banner: "HRD KOREA 컨퍼런스 · LMS 교체 검토 · AI 교육 트렌드",
  },
  5: {
    events: "상반기 공채 최종 합격·온보딩 시작, 대기업 합숙 연수, 중간 관리자 리더십 리프레셔, 퇴직연금교육 실시",
    painPoints: "수백 명 코호트 동시 온보딩 운영 로지스틱스, 합숙 교육 → 블렌디드 전환 고민",
    lmsHook: "대규모 온보딩을 LMS로 운영 — 사전 이러닝·평가·수료 자동화로 운영 부담 절감",
    skillHook: "신입사원 온보딩 후 직무 역량 초기 진단 — 수습 기간 맞춤 학습 경로 배정",
    axHook: "신입사원 AI 실습 교육 — 실제 업무 시나리오 기반 AI 도구 활용 워크숍",
    banner: "신입사원 온보딩 본격화 · 블렌디드 러닝 전환 · AI 실습 교육",
  },
  6: {
    events: "상반기 교육 효과성 중간 평가, 산업안전보건교육 H1 마감(6/30), 예산 소진율 점검, 하반기 계획 조정",
    painPoints: "H1 안전교육 마감 압박, 교육 ROI 데이터 부족으로 성과 입증 어려움, 예산 과소/과다 집행 조정",
    lmsHook: "LMS 학습 데이터로 상반기 교육 성과 리포트 작성 — 이수율·만족도·행동변화 대시보드",
    skillHook: "상반기 교육 후 역량 변화 측정 — 사전-사후 스킬 진단 비교로 교육 효과 입증",
    axHook: "상반기 AI 교육 성과 점검 — AI 활용도 변화 측정, 하반기 심화 과정 기획",
    banner: "상반기 성과 평가 · 안전교육 마감 · 하반기 교육 조정",
  },
  7: {
    events: "하반기 교육 시즌 개막, 임원 전략교육(H1 실적 기반), 신규 승진자 리더십 프로그램, 산업안전교육 H2 시작, 하반기 공채 스코핑",
    painPoints: "8월 휴가철 전 집중 일정 소화, 임원 교육 스케줄 확보 어려움",
    lmsHook: "하반기 LMS 운영 최적화 — 수강 독려 자동화, 미이수자 리마인드 시스템",
    skillHook: "승진자·핵심인재 대상 역량 심화 진단 — 리더십 파이프라인 구축을 위한 데이터",
    axHook: "임원·리더 대상 AI 전략 교육 — AI가 비즈니스에 미치는 영향, 의사결정에 AI 활용",
    banner: "하반기 교육 개막 · 임원 AI 전략교육 · 리더십 파이프라인",
  },
  8: {
    events: "휴가철 비수기, 이러닝·자기주도 학습 소비 피크, 기술직 전문 교육, 벤더 리서치·콘텐츠 리프레시, LMS 도입 의사결정 마무리",
    painPoints: "휴가 시즌 낮은 참여율, 의무교육 이수 추적 어려움, 조용한 시기 활용 고민",
    lmsHook: "휴가철 자기주도 학습 활성화 — 마이크로러닝·모바일 학습으로 이수율 유지 전략",
    skillHook: "하반기 전 스킬갭 분석 리프레시 — 상반기 데이터 기반 교육 과정 재설계",
    axHook: "AI 교육 콘텐츠 자체 제작 — 생성형 AI로 교육 자료 빠르게 만드는 방법",
    banner: "휴가철 자기주도 학습 · 마이크로러닝 · AI 콘텐츠 제작",
  },
  9: {
    events: "하반기 공채 시작, 내년도 교육 계획 수립 착수, CTF 컨퍼런스(KMA), 성과 평가 연동 시작",
    painPoints: "H2 프로그램 운영 + 내년 계획 수립 + 공채 온보딩 준비가 동시에 몰리는 가장 과부하 시기",
    lmsHook: "내년 LMS 전략 수립 — 현 LMS 성과 데이터 분석, 교체/업그레이드 의사결정",
    skillHook: "내년 교육 계획의 출발점 = 조직 역량 진단 — 데이터 기반 교육 니즈 분석(TNA)",
    axHook: "내년 AX 교육 로드맵 설계 — AI 역량 수준별 교육 체계 (입문→활용→전문가)",
    banner: "내년 교육 계획 착수 · 하반기 공채 · CTF 컨퍼런스",
  },
  10: {
    events: "내년 교육 계획·예산안 확정 피크, KHRD 포럼(HRD 트렌드 발표), 중간 관리자 성과 피드백 교육, 행동평가 결과 집계",
    painPoints: "교육 ROI 입증 → 내년 예산 확보 전쟁, 올해 성과 데이터로 내년 투자 정당화",
    lmsHook: "내년 LMS 예산 확보 전략 — ROI 리포트 작성법, 경영진 설득 데이터 포인트",
    skillHook: "역량 진단 데이터로 내년 교육 예산 정당화 — 스킬갭 → 비즈니스 임팩트 연결",
    axHook: "내년 AX 교육 예산 확보 — AI 교육 ROI 산출 프레임워크, 경쟁사 벤치마크",
    banner: "내년 예산 확정 · 교육 ROI 입증 · HRD 트렌드 분석",
  },
  11: {
    events: "연말 법정의무교육 마감 러시(12/31), 연간 교육 효과성 보고서 작성, 내년 예산 최종 승인, 하반기 공채 합격·온보딩 준비",
    painPoints: "미이수 법정교육 한꺼번에 몰림, 성과 보고서 마감 압박, 체크박스식 교육에 대한 자괴감",
    lmsHook: "연말 법정의무교육 LMS 일괄 운영 — 미이수자 자동 알림, 이수 현황 실시간 대시보드",
    skillHook: "연간 역량 변화 리포트 작성 — 연초 vs 연말 스킬 진단 비교, CHRO 보고용 데이터",
    axHook: "AI 교육 연간 성과 정리 — AI 활용 역량 향상도 측정, 내년 심화 과정 근거 마련",
    banner: "법정의무교육 마감 · 연간 성과 보고 · 내년 예산 승인",
  },
  12: {
    events: "법정의무교육 최종 마감(12/31), 연간 교육 실적 보고(CHRO), 내년 벤더 계약·LMS 갱신, 하반기 신입 온보딩, 연말 인사평가",
    painPoints: "연말 휴일로 교육 일정 압축, 의무교육 마감 + 성과 보고 + 인사평가 동시 진행",
    lmsHook: "내년 LMS 선정·갱신 최종 결정 — 도입 시 반드시 체크해야 할 기능 체크리스트",
    skillHook: "연말 인사평가와 역량 진단 연동 — 평가 결과를 내년 교육 계획에 반영하는 방법",
    axHook: "내년 AI 교육 계획 확정 — 직무별 AI 교육 커리큘럼 설계 가이드",
    banner: "LMS 갱신 결정 · 인사평가 연동 · 내년 AI 교육 확정",
  },
};

const ANGLES = [
  "실전 가이드 — 바로 적용 가능한 단계별 방법론",
  "최신 트렌드 — 업계 변화와 선도 기업 움직임",
  "ROI·비용 절감 — 예산 확보와 경영진 설득 논리",
  "도입 사례·비교 — 솔루션/방법론 비교 분석",
  "문제 해결 — 현장에서 자주 부딪히는 이슈와 해법",
  "미래 전망 — 다음 분기/내년을 대비하는 전략",
  "성과 측정 — 교육 효과를 데이터로 입증하는 방법",
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
            reason: { type: "string", description: "왜 지금 이 주제인지 1줄 설명 — 이번 달 HRD 이벤트/페인포인트와 연결" },
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
    const year = new Date().getFullYear();
    const hrd = HRD_CALENDAR[month] ?? HRD_CALENDAR[1];
    const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

    const exclude = previousTopics.length > 0
      ? `\n\n[제외할 주제]\n${previousTopics.join(", ")}`
      : "";

    const prompt = `B2B 교육업 블로그 주제 5개를 추천하세요.

[현재 시점]
${year}년 ${month}월

[이번 달 HRD 캘린더]
주요 이벤트: ${hrd.events}
HRD 담당자 페인포인트: ${hrd.painPoints}

[우리 서비스와 연결 포인트]
- LMS(온라인 교육 플랫폼): ${hrd.lmsHook}
- 스킬 진단(역량 평가): ${hrd.skillHook}
- AX 교육(AI 트랜스포메이션): ${hrd.axHook}

[콘텐츠 관점]
앵글: ${angle}
독자: ${reader}

[주제 생성 규칙]
1. 5개 주제 중 최소 3개는 이번 달 HRD 이벤트/페인포인트와 직접 연결되어야 합니다
2. 5개 주제가 LMS, 스킬 진단, AX 교육 중 최소 2개 서비스 영역을 커버해야 합니다
3. 제목에 시의성을 담으세요: "${month}월", "${year}년 ${Math.ceil(month / 3)}분기", 구체적 이벤트명 등
4. 제목 형식을 다양하게: "~하는 방법", "~ 5가지", "${year}년 ~", "왜 ~인가", "~ 체크리스트" 등. "A vs B" 비교는 최대 1개
5. reason은 "지금 이 주제가 왜 시의적절한지"를 이번 달 HRD 맥락으로 설명하세요
6. angle 필드에는 형식 태그 대신 글의 구체적 내용을 한 줄로 설명하세요

[카테고리]
이러닝/마이크로러닝, LMS 운영·도입, 스킬 진단·역량 평가, AX(AI 트랜스포메이션) 교육, 법정의무교육 운영

[제외 주제]
AI 튜터, AI 코칭, 적응형 학습, AI 진단, 리더십, 소프트스킬

중요: 연도를 언급할 때 반드시 ${year}년을 사용하세요.${exclude}`;

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

// Export for use in TopicStep banner
export { HRD_CALENDAR };
