"use client";

import { useState, useEffect } from "react";
import type { SEO } from "@/types";
import { exportSEO, copyToClipboard } from "@/lib/export";

interface SeoTabProps {
  seo: SEO;
  onCopied?: () => void;
}

interface KeywordMetric {
  keyword: string;
  avgMonthlySearches: number | null;
  competition: string;
  competitionIndex: number | null;
}

function CheckItem({ text, guide }: { text: string; guide: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <label className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 ${checked ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-100 hover:bg-gray-100"}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
        className="mt-0.5 w-4 h-4 rounded accent-[#1B72FF] shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-relaxed ${checked ? "text-green-700 line-through opacity-70" : "text-gray-800"}`}>
          {text}
        </p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{guide}</p>
      </div>
    </label>
  );
}

function competitionLabel(comp: string): { text: string; color: string } {
  switch (comp) {
    case "LOW": return { text: "낮음", color: "text-green-600 bg-green-50 border-green-200" };
    case "MEDIUM": return { text: "보통", color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
    case "HIGH": return { text: "높음", color: "text-red-600 bg-red-50 border-red-200" };
    default: return { text: "-", color: "text-gray-400 bg-gray-50 border-gray-200" };
  }
}

function recommendScore(searches: number | null, compIndex: number | null): { score: number; label: string; color: string } {
  if (searches === null || compIndex === null) return { score: 0, label: "-", color: "text-gray-400" };
  // Higher searches + lower competition = higher recommendation
  const searchScore = Math.min(searches / 1000, 5); // 0~5
  const compScore = (100 - compIndex) / 20; // 0~5
  const raw = Math.round((searchScore * 0.6 + compScore * 0.4) * 20);
  const score = Math.min(Math.max(raw, 5), 100);
  if (score >= 70) return { score, label: "추천", color: "text-green-600" };
  if (score >= 40) return { score, label: "보통", color: "text-yellow-600" };
  return { score, label: "낮음", color: "text-gray-500" };
}

function formatSearchVolume(vol: number | null): string {
  if (vol === null) return "-";
  if (vol >= 10000) return `${(vol / 10000).toFixed(1)}만`;
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}천`;
  return vol.toLocaleString();
}

function KeywordRow({ metric, isPrimary }: { metric: KeywordMetric; isPrimary?: boolean }) {
  const comp = competitionLabel(metric.competition);
  const rec = recommendScore(metric.avgMonthlySearches, metric.competitionIndex);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isPrimary ? "border-[#B3D4FF] bg-[#F0F6FF]" : "border-gray-100 bg-gray-50"}`}>
      <div className="flex-1 min-w-0">
        <span className={isPrimary
          ? "inline-block bg-[#1B72FF] text-white text-sm font-semibold px-3 py-1 rounded-full"
          : "text-sm font-medium text-gray-800"
        }>
          {metric.keyword}
        </span>
      </div>
      <div className="flex items-center gap-4 shrink-0 text-xs">
        <div className="text-center w-16">
          <p className="text-gray-400 mb-0.5">월 검색량</p>
          <p className="font-semibold text-gray-800">{formatSearchVolume(metric.avgMonthlySearches)}</p>
        </div>
        <div className="text-center w-14">
          <p className="text-gray-400 mb-0.5">경쟁도</p>
          <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-medium ${comp.color}`}>
            {comp.text}
          </span>
        </div>
        <div className="text-center w-14">
          <p className="text-gray-400 mb-0.5">추천</p>
          <p className={`font-bold ${rec.color}`}>{rec.score > 0 ? rec.score : "-"}</p>
        </div>
      </div>
    </div>
  );
}

export default function SeoTab({ seo, onCopied }: SeoTabProps) {
  const [metrics, setMetrics] = useState<KeywordMetric[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsSource, setMetricsSource] = useState<string>("");

  useEffect(() => {
    const allKeywords = [seo.primaryKeyword, ...seo.secondaryKeywords].filter(Boolean);
    if (allKeywords.length === 0) return;

    setMetricsLoading(true);
    fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: allKeywords }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.keywords) {
          setMetrics(data.keywords);
          setMetricsSource(data.source === "google_ads" ? "Google Ads" : "AI 추정");
        }
      })
      .catch(() => { /* ignore */ })
      .finally(() => setMetricsLoading(false));
  }, [seo.primaryKeyword, seo.secondaryKeywords]);

  const handleCopy = async () => {
    await copyToClipboard(exportSEO(seo));
    onCopied?.();
  };

  const primaryMetric = metrics.find((m) => m.keyword === seo.primaryKeyword);
  const secondaryMetrics = seo.secondaryKeywords
    .map((kw) => metrics.find((m) => m.keyword === kw))
    .filter((m): m is KeywordMetric => m !== undefined);

  return (
    <div className="space-y-10">
      {/* SEO Meta Tags */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-7 h-7 rounded-full bg-[#E8F1FF] text-[#1B72FF] text-xs flex items-center justify-center font-bold">S</span>
          <h3 className="text-base font-bold text-gray-900">SEO 메타 태그</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 ml-9">블로그 발행 시 아래 내용을 메타 태그에 복사해서 붙여넣으세요.</p>

        <div className="space-y-4 ml-9">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500">메타 타이틀</label>
              <span className={`text-xs font-mono ${seo.metaTitle.length > 60 ? "text-red-500" : "text-gray-400"}`}>
                {seo.metaTitle.length}/60
              </span>
            </div>
            <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-sm text-gray-800">
              {seo.metaTitle}
            </div>
            <p className="text-xs text-gray-400 mt-1">→ 블로그 관리자 {'>'} SEO 설정 {'>'} 타이틀에 입력</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500">메타 설명 (디스크립션)</label>
              <span className={`text-xs font-mono ${seo.metaDesc.length > 155 ? "text-red-500" : "text-gray-400"}`}>
                {seo.metaDesc.length}/155
              </span>
            </div>
            <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-sm text-gray-800 leading-relaxed">
              {seo.metaDesc}
            </div>
            <p className="text-xs text-gray-400 mt-1">→ 블로그 관리자 {'>'} SEO 설정 {'>'} 설명에 입력</p>
          </div>
        </div>
      </section>

      {/* Keywords with metrics */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">K</span>
          <h3 className="text-base font-bold text-gray-900">키워드 전략</h3>
          {metricsSource && (
            <span className="text-xs text-gray-400 ml-auto">데이터 출처: {metricsSource}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-4 ml-9">
          검색량과 경쟁도를 기반으로 키워드 전략을 수립하세요.
          <span className="block mt-1 text-gray-350">추천 점수는 검색량이 높고 경쟁도가 낮을수록 높게 산출됩니다. 점수가 높을수록 상위 노출 가능성이 큽니다.</span>
        </p>

        <div className="ml-9 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">주요 키워드 (제목 + 도입부에 반드시 포함)</p>
            {metricsLoading ? (
              <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ) : primaryMetric ? (
              <KeywordRow metric={primaryMetric} isPrimary />
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#B3D4FF] bg-[#F0F6FF]">
                <span className="inline-block bg-[#1B72FF] text-white text-sm font-semibold px-3 py-1 rounded-full">
                  {seo.primaryKeyword}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">보조 키워드 (본문 중 2~3회 자연스럽게 삽입)</p>
            <div className="space-y-2">
              {metricsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))
              ) : secondaryMetrics.length > 0 ? (
                secondaryMetrics.map((m) => (
                  <KeywordRow key={m.keyword} metric={m} />
                ))
              ) : (
                seo.secondaryKeywords.map((kw) => (
                  <div key={kw} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50">
                    <span className="text-sm font-medium text-gray-800">{kw}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* GEO Checklist */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">G</span>
          <h3 className="text-base font-bold text-gray-900">GEO 체크리스트</h3>
        </div>
        <div className="ml-9 mb-4">
          <p className="text-xs text-gray-400">ChatGPT, Perplexity 등 생성형 AI가 답변할 때 <strong className="text-gray-600">출처로 인용</strong>되기 위한 항목입니다.</p>
          <p className="text-xs text-gray-400 mt-1">GEO는 SEO와 달리 &apos;신뢰·권위·구조화&apos;가 핵심입니다.</p>
        </div>
        <div className="ml-9 space-y-2">
          <CheckItem
            text="통계·데이터 인용에 출처가 명시되어 있는가?"
            guide="예) 'Deloitte 2025 보고서에 따르면...' — AI는 출처가 있는 콘텐츠를 우선 참조합니다."
          />
          <CheckItem
            text="비교·분류 정보가 리스트나 번호로 구조화되어 있는가?"
            guide="AI는 정리된 구조화 데이터를 비정형 텍스트보다 먼저 인용합니다."
          />
          <CheckItem
            text="단계별 가이드('Step 1→2→3')가 포함되어 있는가?"
            guide="'~하는 방법' 검색 시 단계별 프로세스가 AI 답변에 인용될 확률이 높습니다."
          />
          <CheckItem
            text="각 문단이 독립적으로 읽혀도 맥락이 통하는가?"
            guide="AI는 문단 단위로 발췌합니다. 앞뒤 문맥 없이도 의미가 완결되어야 합니다."
          />
        </div>
      </section>

      {/* Copy button */}
      <div className="pt-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#1B72FF] border border-gray-200 hover:border-[#B3D4FF] px-4 py-2.5 rounded-xl transition-all duration-150 bg-white hover:bg-[#E8F1FF]"
        >
          SEO 정보 복사
        </button>
      </div>
    </div>
  );
}
