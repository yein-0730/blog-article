import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const BASE_SYSTEM_PROMPT = `당신은 B2B 교육업 전문 콘텐츠 마케터입니다.
기업 교육(HRD), 인재개발, 조직학습 분야에 깊은 전문성을 갖고 있으며,
HRD 담당자가 실무에 바로 활용할 수 있는 인사이트 중심의 글을 작성합니다.

[핵심 원칙]
- 주장에는 반드시 근거를 제시하세요 (프레임워크, 구조적 분석, 검증 가능한 통계 등)
- 사례는 실제로 검증 가능한 것만 사용하세요
- 검증 가능한 사례가 없으면 프레임워크·구조·방법론의 깊이로 설득하세요
- HRD 실무자가 실행 가능하다고 느낄 수 있는 내용을 포함하세요
- 각 섹션이 독립적으로도 의미가 있되, 전체가 논리적으로 연결되어야 합니다
- 문장 간 연결이 자연스럽게 흐르도록 접속어·전환 표현을 활용하세요

[공통 톤 원칙]
- 서술체는 합쇼체(~입니다, ~됩니다)를 기본으로 사용하세요
- "우리 조직", "현장에서는" 등 공감 표현으로 거리를 좁히세요
- 문제 제기 → 원인 분석 → 구조적 해법 → 실행 제안의 흐름을 따르세요
- 사용 금지 단어: "병목"

[GEO 최적화 — 생성형 AI 출처 인용 극대화]
- 소제목은 질문형으로 작성하세요
- 각 섹션 첫 1~2문장에서 소제목 질문에 직접 답변하세요
- 핵심 개념에 정의형 문장을 포함하세요
- 비교·분류 정보는 번호 리스트로 구조화하세요
- 통계·데이터 인용 시 출처를 명확히 기재하세요
- 단계별 가이드를 포함하세요`;

const TONE_ADDITIONS: Record<string, string> = {
  professional: `\n[톤] 객관적 서술체. 프레임워크·모델 적극 활용. 핵심 개념은 리스트로 구조화.`,
  friendly: `\n[톤] 부드러운 종결어미(~인데요, ~이죠). 체크리스트·단계별 가이드 활용. 짧은 문장.`,
  challenging: `\n[톤] 냉정한 현실 점검. 통념을 뒤집는 질문. "~이 아니라 ~이다" 대비 구조.`,
};

const READER_CONTEXTS: Record<string, string> = {
  hrd: "타겟 독자: HRD 담당자 (교육과정 기획·운영, 교육 효과 측정, 예산 확보가 주요 고민)",
  clo: "타겟 독자: CLO·교육팀장 (교육 ROI, 조직 역량 체계, 경영진 설득이 핵심)",
  hrPlanner: "타겟 독자: HR 기획자 (Employee Journey 관점, 교육은 리텐션·성과관리와 연결)",
  eduOperator: "타겟 독자: 교육 운영자 (LMS 운영, 수강 독려, 효율화·자동화에 관심)",
};

// Tool schemas — forces Claude to return valid JSON via tool_use
const ARTICLE_TOOL: Anthropic.Tool = {
  name: "save_article",
  description: "생성된 블로그 아티클을 저장합니다",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "블로그 제목 30자 내외" },
      intro: { type: "string", description: "도입부 3~4문장" },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            heading: { type: "string", description: "질문형 소제목" },
            directAnswer: { type: "string", description: "질문에 대한 직접 답변 1~2문장" },
            body: { type: "string", description: "본문. 마크다운 사용 가능(볼드, 리스트, 인용). 줄바꿈은 \\n" },
            keyPoint: { type: "string", description: "이 섹션에서 독자가 반드시 기억해야 할 핵심 인사이트 1문장. 구체적이고 실행 가능한 메시지로, 이 문장만 봐도 본문을 읽고 싶게 만드세요. 예: '교육 ROI를 3배 높이는 핵심은 사전 진단 → 맞춤 설계 → 현업 적용의 3단계 순환 구조에 있다'" },
          },
          required: ["id", "heading", "directAnswer", "body", "keyPoint"],
        },
      },
      outro: { type: "string", description: "마무리 2~3문장" },
    },
    required: ["title", "intro", "sections", "outro"],
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
            question: { type: "string" },
            answer: { type: "string" },
          },
          required: ["question", "answer"],
        },
      },
      seo: {
        type: "object",
        properties: {
          metaTitle: { type: "string" },
          metaDesc: { type: "string" },
          primaryKeyword: { type: "string" },
          secondaryKeywords: { type: "array", items: { type: "string" } },
          geoTips: { type: "array", items: { type: "string" } },
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
    const { topic, directKeyword, tone, charLength, reader, sectionCount } = body;
    const keyword = topic?.title || directKeyword;

    if (!keyword || !tone || !charLength || !reader || !sectionCount) {
      return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
    }

    const toneAddition = TONE_ADDITIONS[tone] ?? TONE_ADDITIONS["professional"];
    const readerContext = READER_CONTEXTS[reader] ?? READER_CONTEXTS["hrd"];
    const systemPrompt = BASE_SYSTEM_PROMPT + toneAddition;

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        const pingInterval = setInterval(() => {
          try { controller.enqueue(encoder.encode(":\n\n")); } catch { /* closed */ }
        }, 5000);

        try {
          // Parallel: article (Sonnet + tool_use) & meta (Haiku + tool_use)
          const articlePromise = client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 8000,
            temperature: 0.7,
            system: systemPrompt,
            tools: [ARTICLE_TOOL],
            tool_choice: { type: "tool", name: "save_article" },
            messages: [{
              role: "user",
              content: `키워드/주제: ${keyword}\n${readerContext}\n목표 분량: 약 ${charLength}자\n섹션 수: ${sectionCount}개\n\n위 조건에 맞는 HRD 블로그 아티클을 작성하고 save_article 도구로 저장해주세요.`,
            }],
          });

          const metaPromise = client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2000,
            temperature: 0.7,
            system: "당신은 B2B 교육업 SEO/GEO 전문가입니다.",
            tools: [META_TOOL],
            tool_choice: { type: "tool", name: "save_meta" },
            messages: [{
              role: "user",
              content: `키워드: ${keyword}\n${readerContext}\n섹션 수: ${sectionCount}개 (sec_1~sec_${sectionCount})\n\nFAQ 3개, SEO 메타데이터, 섹션별 시각화 프롬프트를 생성하고 save_meta 도구로 저장해주세요.`,
            }],
          });

          const [articleRes, metaRes] = await Promise.all([articlePromise, metaPromise]);
          clearInterval(pingInterval);

          // Extract tool_use input from responses
          const articleBlock = articleRes.content.find((b) => b.type === "tool_use");
          const metaBlock = metaRes.content.find((b) => b.type === "tool_use");

          if (!articleBlock || articleBlock.type !== "tool_use") {
            throw new Error("아티클 생성 결과를 받지 못했습니다.");
          }

          const articleData = articleBlock.input as Record<string, unknown>;
          const metaData = (metaBlock && metaBlock.type === "tool_use")
            ? metaBlock.input as Record<string, unknown>
            : { faq: [], seo: {}, visuals: [] };

          console.log("Meta data keys:", Object.keys(metaData));
          console.log("Visuals count:", Array.isArray(metaData.visuals) ? (metaData.visuals as unknown[]).length : "not array");

          // Ensure visuals, faq, seo always exist
          const merged = {
            ...articleData,
            faq: metaData.faq ?? [],
            seo: metaData.seo ?? {},
            visuals: metaData.visuals ?? [],
          };

          controller.enqueue(encoder.encode(JSON.stringify(merged)));
          controller.close();
        } catch (err) {
          clearInterval(pingInterval);
          const msg = err instanceof Error ? err.message : "생성 오류";
          console.error("Generate error:", msg);
          controller.enqueue(encoder.encode(JSON.stringify({ error: msg })));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Generate API error:", error);
    return Response.json({ error: "아티클 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
