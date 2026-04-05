import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface MonthlyHRDContext {
  tasks: string;
  painPoints: string;
  lmsHook: string;
  skillHook: string;
  axHook: string;
  banner: string;
}

const HRD_CALENDAR: Record<number, MonthlyHRDContext> = {
  1: {
    tasks: "연간 교육 계획 실행 착수, 예산 집행 시작, LMS에 연간 로드맵 셋업, 법정의무교육 이수 시계 시작",
    painPoints: "올해 교육 예산을 어디에 먼저 써야 할지 우선순위 결정, 작년 교육 데이터를 바탕으로 올해 뭘 바꿔야 할지 판단",
    lmsHook: "새해 LMS에 연간 교육 로드맵을 셋업하고, 부서별 필수 교육을 배정하는 시기",
    skillHook: "연초 직무 스킬 진단으로 부서별 스킬갭을 수치화하고, 올해 교육 우선순위를 '감'이 아닌 데이터로 결정하는 시기",
    axHook: "어떤 직무부터, 어떤 수준으로 AI 리터러시를 높일지 연간 AI 교육 로드맵을 짜는 시기",
    banner: "연간 교육 계획 실행 · 예산 우선순위 결정 · AI 교육 로드맵",
  },
  2: {
    tasks: "상반기 공채 시작, 신입사원 온보딩 프로그램 설계, 부서별 교육 니즈 취합, 성희롱 예방교육 조기 실시",
    painPoints: "채용과 동시에 온보딩 프로그램을 급하게 설계해야 하는 압박, 신입사원이 빠르게 적응하도록 교육을 어떻게 구성할지",
    lmsHook: "신입사원 온보딩을 LMS 기반 블렌디드로 설계 — 입사 전 사전 이러닝 + 현장 OJT 조합",
    skillHook: "신입사원 대상 직무 스킬 시험형 진단 실시 → 결과에 따라 레벨별 교육 콘텐츠 자동 배정으로 맞춤 온보딩",
    axHook: "MZ세대 신입사원에게 ChatGPT·Copilot 등 AI 도구 활용 교육을 온보딩에 포함시키는 시기",
    banner: "신입사원 온보딩 설계 · 교육 니즈 취합 · MZ세대 AI 교육",
  },
  3: {
    tasks: "상반기 공채 피크, 산업안전보건교육 상반기분 시작(6/30 마감), 신임 관리자 교육 개시, 작년 TNA 결과 반영한 과정 개편",
    painPoints: "채용·법정교육·승진교육이 한꺼번에 몰리는 가장 바쁜 시기, 산업안전교육 사업장별 이수 관리가 번거로움",
    lmsHook: "법정의무교육(산업안전보건)을 LMS로 효율화 — 사업장별 이수 현황 실시간 추적과 미이수자 자동 알림",
    skillHook: "승진자 대상 직무 스킬 진단으로 실제 업무 수행 능력 측정 — 기존 추상적 역량 평가 대신 시험형 평가로 객관적 데이터 확보",
    axHook: "신입사원 온보딩에 AI 역량 교육을 필수로 포함 — AI 시대 디지털 기초 역량 확보",
    banner: "법정교육 시작 · 신입사원 온보딩 · 신임 관리자 교육",
  },
  4: {
    tasks: "Q1에 수립한 연간 교육 계획 기반으로 단건 교육 기획·운영 시작, 법정의무교육(장애인 인식개선·개인정보보호) 실시, 직무별 교육 프로그램 설계",
    painPoints: "단건 교육을 어떤 주제·형태로 기획할지 고민, 현업 부서의 교육 참여를 어떻게 끌어낼지, 교육 효과가 실제 업무에 이어질지 불확실",
    lmsHook: "단건 교육을 LMS에 탑재해서 운영 효율화 — 대면+온라인 블렌디드로 참여율 높이기, 수강 현황 자동 추적",
    skillHook: "단건 교육 기획 전 직무 스킬 진단 실시 — 어떤 스킬이 부족한지 데이터로 확인하고, 진단 결과 기반으로 교육 주제 선정",
    axHook: "Q2 단건 교육으로 AI 활용 교육 운영 — 직무별 AI 도구 실습, 부서별 맞춤 AI 교육 프로그램 설계",
    banner: "단건 교육 기획·운영 · 법정의무교육 실시 · AI 활용 교육",
  },
  5: {
    tasks: "단건 교육 운영 본격화, 신입사원 온보딩 교육 병행, 법정의무교육 지속, 중간관리자 대상 교육 운영",
    painPoints: "여러 교육을 동시에 운영하는 부담, 교육 참여율이 기대보다 낮음, 현업에서 '교육 때문에 업무에 지장' 반발",
    lmsHook: "다수의 단건 교육을 LMS에서 통합 관리 — 일정·수강자·이수 현황을 한 곳에서 추적, 미이수자 자동 알림",
    skillHook: "교육 대상자를 스킬 진단 결과로 선별 — 전 직원이 아닌 해당 스킬이 부족한 인원만 타겟팅해서 교육 효율 극대화",
    axHook: "AI 활용 교육 운영 중 — 실습 중심 워크숍 설계, 부서별 AI 활용 사례 공유, 교육 후 실제 업무 적용 추적",
    banner: "단건 교육 운영 · 교육 참여율 관리 · AI 실습 워크숍",
  },
  6: {
    tasks: "상반기 교육 운영 마무리, 교육 성과 중간 평가, 산업안전보건교육 상반기 마감(6/30), 하반기 교육 계획 조정",
    painPoints: "상반기에 운영한 교육의 효과를 어떻게 측정해서 보고할지, 다음 분기 교육을 어떻게 개선할지",
    lmsHook: "LMS 학습 데이터로 상반기 교육 운영 성과 리포트 — 이수율·완료율·만족도 한눈에 보기",
    skillHook: "상반기 교육 전후 직무 스킬 점수 비교로 교육 효과를 숫자로 입증 — 설문 만족도가 아닌 실제 스킬 향상 데이터",
    axHook: "상반기 AI 교육 결과 점검 — 직원들의 AI 활용도가 실제로 올랐는지, 하반기 심화 과정 기획",
    banner: "상반기 교육 성과 평가 · 안전교육 마감 · 하반기 교육 기획",
  },
  7: {
    tasks: "하반기 교육 본격 시작, 임원 대상 전략 교육(상반기 실적 기반), 승진자 리더십 프로그램, 산업안전교육 하반기분 시작",
    painPoints: "8월 휴가철 전에 교육을 집중 소화해야 하는 압박, 임원 스케줄 잡기 어려움",
    lmsHook: "하반기 LMS 운영 최적화 — 수강 독려 자동화, 미이수자 리마인드 푸시 설정",
    skillHook: "핵심인재 직무 스킬 심화 진단 — 감이 아닌 시험형 평가 데이터로 인력 배치와 육성 계획 수립",
    axHook: "임원·리더 대상 AI 전략 교육 — AI가 우리 비즈니스에 미치는 영향, 의사결정에 AI 활용하는 법",
    banner: "하반기 교육 시작 · 임원 AI 전략교육 · 승진자 역량 진단",
  },
  8: {
    tasks: "휴가철 비수기, 자기주도 이러닝 소비 피크, 콘텐츠 리프레시 및 하반기 교육 자료 준비, LMS 도입 의사결정 마무리",
    painPoints: "휴가 시즌이라 교육 참여율이 뚝 떨어짐, 이 조용한 시기를 어떻게 활용할지 고민",
    lmsHook: "휴가철에도 이수율 유지하는 전략 — 마이크로러닝·모바일 학습으로 짧게 쪼개서 제공",
    skillHook: "자발적 학습 참여율이 떨어지는 시기 — 스킬 진단을 성과평가가 아닌 '커리어 성장 도구'로 포지셔닝하는 방법",
    axHook: "조용한 시기에 AI 교육 콘텐츠 자체 제작 — 생성형 AI로 교육 자료를 빠르게 만드는 방법",
    banner: "휴가철 이수율 관리 · 마이크로러닝 · AI 콘텐츠 제작",
  },
  9: {
    tasks: "하반기 공채 시작, 내년도 교육 계획 수립 착수, 올해 교육 성과 데이터 정리, 성과 평가와 교육 연동 시작",
    painPoints: "하반기 프로그램 운영 + 내년 계획 수립 + 공채 온보딩 준비가 동시에 몰리는 과부하 시기, 내년 뭘 해야 할지 감이 안 잡힘",
    lmsHook: "내년 LMS 전략 수립 — 올해 LMS 데이터 분석으로 교체할지 업그레이드할지 판단",
    skillHook: "내년 교육 계획의 출발점 = 직무 스킬 진단 — '역량'이 아닌 '시장이 요구하는 스킬' 기준으로 교육 니즈 분석(TNA)",
    axHook: "내년 AX 교육 로드맵 설계 — AI 역량 수준별 교육 체계(입문→활용→전문가) 구축",
    banner: "내년 교육 계획 착수 · 역량 진단(TNA) · AI 교육 로드맵",
  },
  10: {
    tasks: "내년 교육 예산안 확정, 올해 교육 ROI 정리·보고, 내년 업체 선정 협상, 중간 관리자 성과 피드백 교육",
    painPoints: "교육 ROI를 숫자로 입증해서 내년 예산을 확보해야 하는 압박, 경영진을 어떻게 설득할지",
    lmsHook: "LMS 데이터로 교육 ROI 리포트 작성 — 경영진 설득용 핵심 지표 정리",
    skillHook: "직무 스킬 진단 데이터로 내년 교육 예산 정당화 — 스킬갭 수치를 비즈니스 손실로 환산해서 경영진 설득",
    axHook: "내년 AI 교육 예산 확보 — ROI 산출 프레임워크, 경쟁사 AI 교육 투자 벤치마크",
    banner: "내년 예산 확보 · 교육 ROI 입증 · AI 교육 투자 근거",
  },
  11: {
    tasks: "연말 법정의무교육 마감 러시(12/31 마감), 연간 교육 성과 보고서 작성, 내년 예산 최종 승인, 하반기 공채 합격자 온보딩 준비",
    painPoints: "미이수 법정교육이 한꺼번에 몰려서 정신없음, 올해 교육 성과를 CHRO에게 보고해야 하는 마감 압박",
    lmsHook: "법정의무교육 LMS 일괄 운영 — 미이수자 자동 알림·독촉, 이수 현황 실시간 대시보드",
    skillHook: "연간 직무 스킬 점수 변화 리포트 — 연초 vs 연말 진단 비교로 교육 투자 대비 스킬 향상 수치 CHRO 보고",
    axHook: "AI 교육 연간 성과 정리 — 직원 AI 활용 역량이 실제로 얼마나 올랐는지, 내년 심화 과정 근거",
    banner: "법정의무교육 마감 · 연간 성과 보고 · 내년 계획 확정",
  },
  12: {
    tasks: "법정의무교육 최종 마감(12/31), 연간 교육 실적 CHRO 보고, 내년 LMS 갱신·업체 계약, 하반기 신입 온보딩, 연말 인사평가",
    painPoints: "연말 휴일로 교육 일정이 빡빡함, 의무교육 마감 + 성과 보고 + 인사평가가 한꺼번에",
    lmsHook: "내년 LMS 선정·갱신 최종 결정 — 도입할 때 반드시 확인해야 할 기능 체크리스트",
    skillHook: "연말 인사평가와 직무 스킬 진단 데이터 연동 — 평가 결과를 내년 개인별 맞춤 교육 경로로 자동 전환",
    axHook: "내년 AI 교육 확정 — 직무별 AI 교육 커리큘럼 최종 설계",
    banner: "LMS 갱신 결정 · 인사평가↔교육 연동 · 내년 AI 교육 확정",
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

const SERVICE_KEYWORDS = [
  { id: "lms", label: "LMS (온라인 교육)" },
  { id: "skill", label: "스킬 진단 (역량 평가)" },
  { id: "ax", label: "AX 교육 (AI 트랜스포메이션)" },
];

const TOPICS_TOOL: Anthropic.Tool = {
  name: "save_topics",
  description: "키워드별 블로그 주제 추천 결과를 저장합니다",
  input_schema: {
    type: "object",
    properties: {
      groups: {
        type: "array",
        description: "3개 키워드 그룹, 각 그룹에 주제 3개",
        items: {
          type: "object",
          properties: {
            keyword: { type: "string", description: "서비스 키워드명: LMS (온라인 교육) / 스킬 진단 (역량 평가) / AX 교육 (AI 교육) 중 하나" },
            topics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "블로그 제목 30자 내외" },
                  angle: { type: "string", description: "핵심 내용 1줄 요약" },
                  keywords: { type: "array", items: { type: "string" }, description: "관련 키워드 2~3개" },
                },
                required: ["title", "angle", "keywords"],
              },
            },
          },
          required: ["keyword", "topics"],
        },
      },
    },
    required: ["groups"],
  },
};

// Shared topic generation logic
async function generateTopics(reader: string, previousTopics: string[]) {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const hrd = HRD_CALENDAR[month] ?? HRD_CALENDAR[1];
  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

  const exclude = previousTopics.length > 0
    ? `\n\n[제외할 주제]\n${previousTopics.join(", ")}`
    : "";

  const prompt = `${year}년 ${month}월, B2B 교육업 블로그 주제를 3개 키워드별 3개씩 추천하세요.

[이번 달 상황] ${hrd.tasks}
[페인포인트] ${hrd.painPoints}
[키워드 연결]
- LMS(온라인 교육 플랫폼): ${hrd.lmsHook}
- 스킬 진단(Skill Match — 설문이 아닌 시험형 직무 스킬 평가 → 결과에 따라 레벨별 교육 자동 추천 → LMS 연동. 기존 추상적 역량 진단의 대안): ${hrd.skillHook}
- AX 교육(AI 트랜스포메이션 교육): ${hrd.axHook}
[앵글] ${angle} [독자] ${reader}

규칙: 제목은 실무 고민 중심, 행사명 금지, 형식 다양하게, ${year}년 사용, 그룹별 중복 금지
제외: AI 튜터, AI 코칭, 적응형 학습, 리더십, 소프트스킬${exclude}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    temperature: 0.8,
    tools: [TOPICS_TOOL],
    tool_choice: { type: "tool", name: "save_topics" },
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("주제 생성 실패");
  }

  const result = block.input as { groups?: unknown[] };
  if (result.groups && result.groups.length > 0) {
    return result;
  }

  throw new Error("주제 생성 결과가 비어있습니다");
}

// GET: cached response for initial page load (revalidate every 24 hours)
export const revalidate = 86400;

export async function GET() {
  try {
    const result = await generateTopics("HRD 담당자", []);
    return Response.json(result, {
      headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=43200" },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Topics GET error:", errMsg);
    return Response.json(
      { error: `주제 추천 중 오류가 발생했습니다.` },
      { status: 500 }
    );
  }
}

// POST: fresh generation for "다른 주제 추천받기" button
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const reader = body.reader ?? "HRD 담당자";
    const previousTopics: string[] = body.previousTopics ?? [];
    const result = await generateTopics(reader, previousTopics);
    return Response.json(result);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Topics POST error:", errMsg);
    return Response.json(
      { error: `주제 추천 중 오류가 발생했습니다.` },
      { status: 500 }
    );
  }
}

export { HRD_CALENDAR, SERVICE_KEYWORDS };
