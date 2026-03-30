"use client";

import { useState } from "react";
import type { SEO } from "@/types";
import { exportSEO, copyToClipboard } from "@/lib/export";

interface SeoTabProps {
  seo: SEO;
  onCopied?: () => void;
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

export default function SeoTab({ seo, onCopied }: SeoTabProps) {
  const handleCopy = async () => {
    await copyToClipboard(exportSEO(seo));
    onCopied?.();
  };

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

      {/* Keywords */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">K</span>
          <h3 className="text-base font-bold text-gray-900">키워드 전략</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 ml-9">아래 키워드가 본문에 자연스럽게 포함되었는지 확인하세요.</p>

        <div className="ml-9 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">주요 키워드 (제목 + 도입부에 반드시 포함)</p>
            <span className="inline-block bg-[#1B72FF] text-white text-sm font-semibold px-4 py-1.5 rounded-full">
              {seo.primaryKeyword}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">보조 키워드 (본문 중 2~3회 자연스럽게 삽입)</p>
            <div className="flex flex-wrap gap-2">
              {seo.secondaryKeywords.map((kw) => (
                <span key={kw} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full border border-gray-200">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AEO Checklist */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-7 h-7 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center font-bold">A</span>
          <h3 className="text-base font-bold text-gray-900">AEO 체크리스트</h3>
        </div>
        <div className="ml-9 mb-4">
          <p className="text-xs text-gray-400">AI 검색(Google AI Overview, 네이버 AI 등)에서 <strong className="text-gray-600">답변으로 직접 채택</strong>되기 위한 항목입니다.</p>
          <p className="text-xs text-gray-400 mt-1">발행 전 아래 항목을 하나씩 확인하세요.</p>
        </div>
        <div className="ml-9 space-y-2">
          <CheckItem
            text="소제목이 독자가 검색할 만한 질문 형태인가?"
            guide="예) 'AI 기업교육이란?' → Google에서 이 질문을 검색하면 우리 글이 답변으로 채택됩니다."
          />
          <CheckItem
            text="각 섹션 첫 문장이 소제목 질문에 대한 직접 답변인가?"
            guide="AI는 질문 바로 다음의 1~2문장을 발췌합니다. '많은 기업이...'가 아닌 '핵심은 ~입니다'로 시작하세요."
          />
          <CheckItem
            text="핵심 개념에 정의형 문장('~란 ~을 의미합니다')이 포함되어 있는가?"
            guide="AI가 '~이란?' 질문에 답할 때 정의형 문장을 우선 발췌합니다."
          />
          {seo.aeoTips.map((tip, i) => (
            <CheckItem
              key={`aeo-${i}`}
              text={tip}
              guide="AI가 생성한 맞춤 AEO 제안입니다."
            />
          ))}
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
          <p className="text-xs text-gray-400 mt-1">GEO는 SEO와 달리 '신뢰·권위·구조화'가 핵심입니다.</p>
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
          {seo.geoTips.map((tip, i) => (
            <CheckItem
              key={`geo-${i}`}
              text={tip}
              guide="AI가 생성한 맞춤 GEO 제안입니다."
            />
          ))}
        </div>
      </section>

      {/* Copy button */}
      <div className="pt-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#1B72FF] border border-gray-200 hover:border-[#B3D4FF] px-4 py-2.5 rounded-xl transition-all duration-150 bg-white hover:bg-[#E8F1FF]"
        >
          📋 SEO 정보 복사
        </button>
      </div>
    </div>
  );
}
