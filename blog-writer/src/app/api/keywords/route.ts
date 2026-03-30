import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Google Ads API credentials (optional)
const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN;
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;

const hasGoogleAds = DEVELOPER_TOKEN && CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && CUSTOMER_ID;

interface KeywordResult {
  keyword: string;
  avgMonthlySearches: number | null;
  competition: string;
  competitionIndex: number | null;
}

// ─── Google Ads API ─────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      refresh_token: REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OAuth 토큰 갱신 실패: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function fetchFromGoogleAds(keywords: string[]): Promise<KeywordResult[]> {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `https://googleads.googleapis.com/v18/customers/${CUSTOMER_ID}:generateKeywordIdeas`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": DEVELOPER_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keywordSeed: { keywords },
        language: "languageConstants/1012",
        geoTargetConstants: ["geoTargetConstants/2410"],
        keywordPlanNetwork: "GOOGLE_SEARCH",
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Google Ads API 오류: ${res.status}`);
  }

  const data = await res.json();
  const results: KeywordResult[] = (data.results || [])
    .filter((r: Record<string, unknown>) =>
      keywords.some((kw) => (r.text as string)?.toLowerCase() === kw.toLowerCase())
    )
    .map((r: Record<string, unknown>) => {
      const metrics = r.keywordIdeaMetrics as Record<string, unknown> | undefined;
      return {
        keyword: r.text as string,
        avgMonthlySearches: (metrics?.avgMonthlySearches as number) ?? null,
        competition: (metrics?.competition as string) ?? "UNSPECIFIED",
        competitionIndex: (metrics?.competitionIndex as number) ?? null,
      };
    });

  // Add missing keywords
  const found = new Set(results.map((r) => r.keyword.toLowerCase()));
  for (const kw of keywords) {
    if (!found.has(kw.toLowerCase())) {
      results.push({ keyword: kw, avgMonthlySearches: null, competition: "UNSPECIFIED", competitionIndex: null });
    }
  }

  return results;
}

// ─── AI Estimation Fallback ─────────────────────────────────────────────────

const ESTIMATE_TOOL: Anthropic.Tool = {
  name: "save_keyword_metrics",
  description: "키워드별 예상 검색량과 경쟁도를 저장합니다",
  input_schema: {
    type: "object",
    properties: {
      keywords: {
        type: "array",
        items: {
          type: "object",
          properties: {
            keyword: { type: "string" },
            avgMonthlySearches: { type: "number", description: "한국 기준 예상 월간 검색량 (구글 기준)" },
            competition: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], description: "SEO 경쟁 난이도" },
            competitionIndex: { type: "number", description: "경쟁도 점수 0~100" },
          },
          required: ["keyword", "avgMonthlySearches", "competition", "competitionIndex"],
        },
      },
    },
    required: ["keywords"],
  },
};

async function estimateWithAI(keywords: string[]): Promise<KeywordResult[]> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    temperature: 0.3,
    system: `당신은 한국 시장 SEO/SEM 전문가입니다. 주어진 키워드의 구글 한국 기준 월간 검색량과 경쟁도를 현실적으로 추정하세요.
B2B/HRD/교육업 키워드는 일반 소비자 키워드보다 검색량이 낮습니다.
- 매우 니치한 B2B 키워드: 10~100
- 일반적인 HRD 키워드: 100~1,000
- 인기 있는 교육/HR 키워드: 1,000~10,000
- 범용 키워드: 10,000+`,
    tools: [ESTIMATE_TOOL],
    tool_choice: { type: "tool", name: "save_keyword_metrics" },
    messages: [{
      role: "user",
      content: `다음 키워드들의 한국 구글 기준 월간 예상 검색량과 SEO 경쟁도를 추정해주세요:\n${keywords.map((k, i) => `${i + 1}. ${k}`).join("\n")}`,
    }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    return keywords.map((kw) => ({ keyword: kw, avgMonthlySearches: null, competition: "UNSPECIFIED", competitionIndex: null }));
  }

  const data = block.input as { keywords: KeywordResult[] };
  return data.keywords;
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json();
  const keywords: string[] = body.keywords;

  if (!keywords || keywords.length === 0) {
    return Response.json({ error: "키워드가 필요합니다." }, { status: 400 });
  }

  try {
    // Try Google Ads first, fallback to AI estimation
    if (hasGoogleAds) {
      try {
        const results = await fetchFromGoogleAds(keywords);
        return Response.json({ keywords: results, source: "google_ads" });
      } catch (err) {
        console.warn("Google Ads API failed, falling back to AI estimation:", err);
      }
    }

    const results = await estimateWithAI(keywords);
    return Response.json({ keywords: results, source: "ai_estimate" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "검색량 조회 오류";
    console.error("Keywords API error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
