import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getBaseSystemPrompt() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);

  return `당신은 B2B 교육업 전문 콘텐츠 마케터입니다.
기업 교육(HRD), 인재개발, 조직학습 분야에 깊은 전문성을 갖고 있으며,
HRD 담당자가 실무에 바로 활용할 수 있는 인사이트 중심의 글을 작성합니다.

[현재 시점]
- 현재: ${year}년 ${month}월 (${year}년 ${quarter}분기)
- 시점 표현 시 반드시 현재 시점을 기준으로 작성하세요
- "${year}년을 앞두고" 같은 미래형 표현을 사용하지 마세요. 이미 ${year}년 ${quarter}분기입니다.

[스타일 가이드 — 패스트캠퍼스 기업교육 블로그 톤]
1. 합쇼체(~합니다/~습니다) 일관 유지. 해요체(~해요/~이죠) 절대 금지
2. 짧은 문장 선호 (30자 이내). 긴 설명은 리스트로 분절 처리
3. 핵심 주장은 **굵은 글씨**와 따옴표("")로 강조
4. 독자를 직접 호칭하지 않음 ("여러분" 금지). 상황 묘사로 간접 공감 유도
   예: "많은 조직이 ~에 동의하지만, 정작 ~는 쉽지 않습니다"
5. 글로벌 기관(맥킨지, 가트너, 딜로이트, WEF 등) 통계를 권위 장치로 활용
6. 기업 사례는 "IT업 C사", "유통업 A사" 형태로 익명 처리
7. 특징적 전환 표현 적극 사용:
   - "단순히 ~가 아니라"
   - "~을 넘어"
   - "이제는 ~할 때"
   - "실제로" / "실질적인"
8. 비교 대조 구조 활용: "기존 vs 개선", "개인 → 팀 → 조직" 점층 구조
9. 각 섹션 도입부에서 이전 논의를 한 문장으로 연결한 뒤 새 논점 제시
10. 이모지, 감탄사, 과장 마케팅 언어("놀라운", "혁신적인") 절대 금지
11. AI를 무조건 긍정 묘사하지 않음. 한계·조건부 효과도 언급하여 신뢰 확보
12. 사용 금지 단어: "병목"

[서비스 연결 — 자연스럽게, 1회만]
- 패스트캠퍼스 서비스(Skill Match, LMS, AX 교육)는 해결책 맥락에서 자연스럽게 1회만 언급
- 글 중간에 CTA 삽입 금지. CTA는 마무리에서만
- 마무리 CTA는 "함께 시작해 보세요" 계열의 부드러운 권유형

[근거 제시 원칙]
- 주장에는 반드시 근거를 제시하세요 (프레임워크, 구조적 분석, 검증 가능한 통계 등)
- 통계·데이터 인용 시 출처와 연도를 명확히 기재하세요 (예: "맥킨지(2024)에 따르면")
- 사례는 실제로 검증 가능한 것만 사용하세요
- 검증 가능한 사례가 없으면 프레임워크·구조·방법론의 깊이로 설득하세요

[SEO 최적화 — H태그 구조]
- H1: 페이지당 1개. 주요 키워드를 앞부분에 배치. 30자 내외
- H2: 섹션 소제목. 검색 쿼리와 일치하도록 키워드 포함. 번호 붙이지 않음
  - 의문형("왜 ~인가?") + 키워드 명사형("LMS 도입 시 핵심 체크리스트") 혼합
- H3: H2 하위 소항목. 구체적 방법론·단계·사례 제목으로 사용
- H2→H3 계층 구조를 반드시 지킬 것 (H1→H3 건너뛰기 금지)

[AI SEO (GEO/AEO) 최적화 — AI 검색엔진 인용 극대화]
- 각 섹션 첫 1~2문장에서 소제목 질문에 40~60단어로 직접 답변 (AI 스니펫 추출용)
- 핵심 개념에 정의형 문장 포함 ("~란, ~을 의미합니다")
- 비교·분류 정보는 번호 리스트로 구조화
- 통계는 구체 수치 + 출처 + 연도 포함 (AI 시스템이 인용할 수 있는 형태)
- 단계별 가이드를 포함하세요 (How-to 쿼리 대응)
- FAQ 섹션은 자연어 질문형으로 작성 (검색 쿼리 패턴 매칭)
- 각 단락은 하나의 명확한 아이디어만 전달 (AI 추출 최적화)`;
}

const TONE_ADDITIONS: Record<string, string> = {
  professional: `\n[톤 세부] 객관적 서술체. 프레임워크·모델 적극 활용. "현상 → 원인 → 시사점" 구조 반복. 핵심 개념은 리스트로 구조화.`,
  friendly: `\n[톤 세부] 합쇼체 유지하되 부드러운 표현. 체크리스트·단계별 가이드 활용. 짧은 문장. "~일 수 있습니다", "~해 보시는 것을 권합니다" 등 권유형.`,
  challenging: `\n[톤 세부] 냉정한 현실 점검. 통념을 뒤집는 질문으로 시작. "~이 아니라 ~이다" 대비 구조. 역설과 반전을 활용한 설득.`,
};

const READER_CONTEXTS: Record<string, string> = {
  hrd: "타겟 독자: HRD 담당자 (교육과정 기획·운영, 교육 효과 측정, 예산 확보가 주요 고민). 독자를 직접 호칭하지 말고, 이들이 처한 상황을 3인칭으로 묘사하여 공감을 유도하세요.",
  clo: "타겟 독자: CLO·교육팀장 (교육 ROI, 조직 역량 체계, 경영진 설득이 핵심). 전략적 시야와 비즈니스 임팩트 관점에서 서술하세요.",
  hrPlanner: "타겟 독자: HR 기획자 (Employee Journey 관점, 교육은 리텐션·성과관리와 연결). 채용→온보딩→성장→리텐션 흐름에서 교육의 역할을 강조하세요.",
  eduOperator: "타겟 독자: 교육 운영자 (LMS 운영, 수강 독려, 효율화·자동화에 관심). 운영 효율과 자동화 관점에서 실무적 해법을 제시하세요.",
};

// --- Tool schemas ---

const OUTLINE_TOOL: Anthropic.Tool = {
  name: "save_outline",
  description: "블로그 아티클 아웃라인을 저장합니다",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "H1 블로그 제목. 주요 키워드를 앞부분에 배치. 30자 내외" },
      intro: { type: "string", description: "도입부 2~3문단. HRD 담당자의 현실 고민을 구체적으로 묘사하며 시작. 글로벌 기관 통계 1개 인용" },
      headings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            heading: { type: "string", description: "H2 소제목. 검색 키워드 포함. 번호 붙이지 않음. 의문형 또는 키워드 명사형" },
            keyMessage: { type: "string", description: "이 섹션에서 다룰 핵심 메시지 1문장" },
          },
          required: ["id", "heading", "keyMessage"],
        },
      },
      outro: { type: "string", description: "마무리 1~2문단. 핵심 메시지 재강조 → 서비스 연결 1문장 → 부드러운 CTA 권유" },
    },
    required: ["title", "intro", "headings", "outro"],
  },
};

const SECTION_TOOL: Anthropic.Tool = {
  name: "save_section",
  description: "블로그 섹션 본문을 저장합니다",
  input_schema: {
    type: "object",
    properties: {
      directAnswer: { type: "string", description: "소제목 질문에 대한 직접 답변 1~2문장 (40~60단어). AI 스니펫 추출에 최적화된 자기완결형 문장" },
      body: { type: "string", description: "본문. 마크다운 사용(볼드, 리스트, 인용). 줄바꿈은 \\n. H3으로 하위 항목 구분 가능. 핵심 주장은 **굵은 글씨**와 따옴표로 강조" },
      keyPoint: { type: "string", description: "이 섹션의 핵심 인사이트 1문장. 구체적이고 실행 가능한 메시지" },
    },
    required: ["directAnswer", "body", "keyPoint"],
  },
};

const META_TOOL: Anthropic.Tool = {
  name: "save_meta",
  description: "아티클의 SEO/FAQ/시각화 메타데이터를 저장합니다",
  input_schema: {
    type: "object",
    properties: {
      faq: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string", description: "자연어 질문형 (검색 쿼리 패턴 매칭)" },
            answer: { type: "string", description: "40~60단어 자기완결형 답변" },
          },
          required: ["question", "answer"],
        },
      },
      seo: {
        type: "object",
        properties: {
          metaTitle: { type: "string", description: "50~60자. 주요 키워드 앞배치. 브랜드명 불포함" },
          metaDesc: { type: "string", description: "150~160자. 주요 키워드 포함. 명확한 가치 제안" },
          primaryKeyword: { type: "string" },
          secondaryKeywords: { type: "array", items: { type: "string" } },
          geoTips: { type: "array", items: { type: "string" }, description: "AI 검색 인용 최적화 팁" },
        },
        required: ["metaTitle", "metaDesc", "primaryKeyword", "secondaryKeywords", "geoTips"],
      },
      visuals: {
        type: "array",
        items: {
          type: "object",
          properties: {
            section: { type: "string" },
            description: { type: "string" },
            prompt: { type: "string" },
          },
          required: ["section", "description", "prompt"],
        },
      },
    },
    required: ["faq", "seo", "visuals"],
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step } = body;

    if (step === "outline") {
      return handleOutline(body);
    } else if (step === "section") {
      return handleSection(body);
    } else if (step === "meta") {
      return handleMeta(body);
    }

    return NextResponse.json({ error: "잘못된 step 파라미터입니다." }, { status: 400 });
  } catch (error) {
    console.error("Generate API error:", error);
    const msg = error instanceof Error ? error.message : "생성 오류";
    return Response.json({ error: msg }, { status: 500 });
  }
}

async function handleOutline(body: Record<string, unknown>) {
  const { topic, directKeyword, tone, charLength, reader, sectionCount } = body as {
    topic?: { title: string }; directKeyword?: string; tone: string; charLength: number; reader: string; sectionCount: number;
  };
  const keyword = topic?.title || directKeyword;

  if (!keyword || !tone || !charLength || !reader || !sectionCount) {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
  }

  const toneAddition = TONE_ADDITIONS[tone] ?? TONE_ADDITIONS["professional"];
  const readerContext = READER_CONTEXTS[reader] ?? READER_CONTEXTS["hrd"];
  const systemPrompt = getBaseSystemPrompt() + toneAddition;

  const [outlineRes, metaRes] = await Promise.all([
    client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      tools: [OUTLINE_TOOL],
      tool_choice: { type: "tool", name: "save_outline" },
      messages: [{
        role: "user",
        content: `키워드/주제: ${keyword}\n${readerContext}\n목표 분량: 약 ${charLength}자\n섹션 수: ${sectionCount}개\n\nH1 제목에 주요 키워드를 앞부분에 배치하세요.\nH2 소제목에 번호를 붙이지 마세요. 검색 키워드를 포함한 의문형 또는 명사형으로 작성하세요.\n도입부는 HRD 담당자의 현실 고민을 구체적으로 묘사하며 시작하세요.\n마무리는 핵심 메시지 재강조 → 서비스 연결 1문장 → 부드러운 CTA로 구성하세요.\n\nsave_outline 도구로 저장해주세요.`,
      }],
    }),
    client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      temperature: 0.7,
      system: `당신은 B2B 교육업 SEO/GEO 전문가입니다.\n\n[SEO 메타 규칙]\n- metaTitle: 50~60자, 주요 키워드 앞배치, 브랜드명 불포함\n- metaDesc: 150~160자, 주요 키워드 포함, 명확한 가치 제안\n- FAQ: 자연어 질문형으로 작성 (검색 쿼리 패턴 매칭)\n- FAQ 답변: 40~60단어 자기완결형 (AI 스니펫 추출 최적화)`,
      tools: [META_TOOL],
      tool_choice: { type: "tool", name: "save_meta" },
      messages: [{
        role: "user",
        content: `키워드: ${keyword}\n${readerContext}\n섹션 수: ${sectionCount}개 (sec_1~sec_${sectionCount})\n\nFAQ 3개와 SEO 메타데이터를 생성하고 save_meta 도구로 저장해주세요. visuals는 빈 배열로 두세요.`,
      }],
    }),
  ]);

  const outlineBlock = outlineRes.content.find((b) => b.type === "tool_use");
  if (!outlineBlock || outlineBlock.type !== "tool_use") {
    return NextResponse.json({ error: "아웃라인 생성 실패" }, { status: 500 });
  }
  const outline = outlineBlock.input as { headings?: { id: string; heading: string; keyMessage: string }[] };

  const metaBlock = metaRes.content.find((b) => b.type === "tool_use");
  const meta = (metaBlock && metaBlock.type === "tool_use")
    ? metaBlock.input as Record<string, unknown>
    : { faq: [], seo: {} };

  // Generate visuals with actual outline headings
  const headings = outline.headings ?? [];
  const visualsRes = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    temperature: 0.7,
    system: "당신은 B2B 교육업 블로그 비주얼 전문가입니다.\n\n[이미지 선정 규칙]\n- 인물의 얼굴이 보이지 않는 사진을 우선 선택 (뒷모습, 실루엣, 오버헤드 뷰, 손만 보이는 작업 장면 등)\n- 동양인 또는 인종이 특정되지 않는 이미지 선호\n- 오피스/교육 환경, 노트북·화이트보드·회의실 등 비즈니스 맥락\n- prompt에 'back view', 'overhead', 'hands only', 'no face', 'minimal' 등의 키워드를 포함하세요",
    tools: [{
      name: "save_visuals",
      description: "섹션별 시각화 프롬프트를 저장합니다",
      input_schema: {
        type: "object",
        properties: {
          visuals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                section: { type: "string", description: "섹션 ID (예: sec_1)" },
                description: { type: "string", description: "이 섹션에 적합한 이미지 설명 (한국어)" },
                prompt: { type: "string", description: "Unsplash 검색용 영문 키워드 (3~5개 단어)" },
              },
              required: ["section", "description", "prompt"],
            },
          },
        },
        required: ["visuals"],
      },
    }],
    tool_choice: { type: "tool", name: "save_visuals" },
    messages: [{
      role: "user",
      content: `키워드: ${keyword}\n\n아래 각 섹션에 어울리는 Unsplash 이미지를 추천해주세요.\n${headings.map((h, i) => `- sec_${i + 1}: ${h.heading}`).join("\n")}\n\n각 섹션마다 description(한국어 설명)과 prompt(Unsplash 검색용 영문 3~5단어)를 생성해주세요.`,
    }],
  });

  const visualsBlock = visualsRes.content.find((b) => b.type === "tool_use");
  const visuals = (visualsBlock && visualsBlock.type === "tool_use")
    ? ((visualsBlock.input as { visuals?: unknown[] }).visuals ?? [])
    : [];

  return NextResponse.json({
    outline: outlineBlock.input,
    meta: {
      faq: meta.faq ?? [],
      seo: meta.seo ?? {},
      visuals,
    },
  });
}

async function handleSection(body: Record<string, unknown>) {
  const { keyword, tone, reader, heading, keyMessage, charPerSection, prevHeading, nextHeading } = body as {
    keyword: string; tone: string; reader: string; heading: string; keyMessage: string;
    charPerSection: number; prevHeading?: string; nextHeading?: string;
  };

  if (!keyword || !heading) {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
  }

  const toneAddition = TONE_ADDITIONS[tone] ?? TONE_ADDITIONS["professional"];
  const readerContext = READER_CONTEXTS[reader] ?? READER_CONTEXTS["hrd"];
  const systemPrompt = getBaseSystemPrompt() + toneAddition;

  const contextLines = [
    `키워드/주제: ${keyword}`,
    readerContext,
    `\n소제목(H2): ${heading}`,
    `핵심 메시지: ${keyMessage}`,
    `목표 분량: 약 ${charPerSection}자`,
    `\n[작성 규칙]`,
    `- directAnswer: 소제목 질문에 대한 직접 답변 1~2문장 (40~60단어). 이 문장만으로도 의미가 통하는 자기완결형으로 작성`,
    `- body: 핵심 주장은 **굵은 글씨**와 따옴표("")로 강조. H3으로 하위 항목 구분 가능. 리스트·번호 적극 활용`,
    `- 통계 인용 시 출처와 연도 명시 (예: "가트너(2024)에 따르면")`,
    `- 기업 사례는 "IT업 C사" 형태로 익명 처리`,
  ];
  if (prevHeading) contextLines.push(`이전 섹션: ${prevHeading}`);
  if (nextHeading) contextLines.push(`다음 섹션: ${nextHeading}`);
  contextLines.push(`\nsave_section 도구로 저장해주세요.`);

  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    temperature: 0.7,
    system: systemPrompt,
    tools: [SECTION_TOOL],
    tool_choice: { type: "tool", name: "save_section" },
    messages: [{ role: "user", content: contextLines.join("\n") }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    return NextResponse.json({ error: "섹션 생성 실패" }, { status: 500 });
  }

  return NextResponse.json({ section: block.input });
}

async function handleMeta(body: Record<string, unknown>) {
  const { keyword, reader, sectionCount } = body as {
    keyword: string; reader: string; sectionCount: number;
  };

  const readerContext = READER_CONTEXTS[reader] ?? READER_CONTEXTS["hrd"];

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    temperature: 0.7,
    system: `당신은 B2B 교육업 SEO/GEO 전문가입니다.\n\n[SEO 메타 규칙]\n- metaTitle: 50~60자, 주요 키워드 앞배치, 브랜드명 불포함\n- metaDesc: 150~160자, 주요 키워드 포함, 명확한 가치 제안\n- FAQ: 자연어 질문형 (검색 쿼리 패턴 매칭)\n- FAQ 답변: 40~60단어 자기완결형`,
    tools: [META_TOOL],
    tool_choice: { type: "tool", name: "save_meta" },
    messages: [{
      role: "user",
      content: `키워드: ${keyword}\n${readerContext}\n섹션 수: ${sectionCount}개 (sec_1~sec_${sectionCount})\n\nFAQ 3개, SEO 메타데이터, 섹션별 시각화 프롬프트를 생성하고 save_meta 도구로 저장해주세요.`,
    }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    return NextResponse.json({ meta: { faq: [], seo: {}, visuals: [] } });
  }

  const meta = block.input as Record<string, unknown>;
  return NextResponse.json({
    meta: {
      faq: meta.faq ?? [],
      seo: meta.seo ?? {},
      visuals: meta.visuals ?? [],
    },
  });
}
