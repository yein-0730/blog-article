"use client";

import { useState, useEffect } from "react";
import { marked } from "marked";
import type { Article } from "@/types";

interface ArticleTabProps {
  article: Article;
  regeneratingId: string | null;
  onRegenerate: (type: string, sectionId?: string) => void;
  onRegenerateWithFeedback: (
    type: string,
    sectionId: string,
    feedback: string
  ) => void;
}

function RegenerateButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs text-gray-400 hover:text-[#1B72FF] border border-gray-200 hover:border-[#B3D4FF] px-2.5 py-1 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      🔄 다시쓰기
    </button>
  );
}

function FeedbackInline({
  onSubmit,
  onCancel,
}: {
  onSubmit: (feedback: string) => void;
  onCancel: () => void;
}) {
  const [feedback, setFeedback] = useState("");

  return (
    <div className="mt-3 border border-[#B3D4FF] rounded-xl p-4 bg-[#E8F1FF]">
      <p className="text-xs font-semibold text-[#1B72FF] mb-2">수정 방향을 알려주세요</p>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="예) 더 구체적인 수치를 포함해 주세요. 실무 예시를 더 넣어주세요."
        rows={3}
        className="w-full border border-[#B3D4FF] rounded-lg px-3 py-2 text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B3D4FF] resize-none"
        autoFocus
      />
      <div className="flex gap-2 mt-2 justify-end">
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
        >
          취소
        </button>
        <button
          onClick={() => {
            if (feedback.trim()) onSubmit(feedback.trim());
          }}
          disabled={!feedback.trim()}
          className="text-xs font-semibold bg-[#1B72FF] hover:bg-[#1456CC] text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          수정 반영
        </button>
      </div>
    </div>
  );
}

function renderMarkdown(md: string): string {
  try {
    const result = marked(md, { breaks: true });
    if (typeof result === "string") return result;
    return md;
  } catch {
    return md;
  }
}

function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="bg-white/80 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm border border-[#B3D4FF]">
        <svg className="animate-spin w-4 h-4 text-[#1B72FF]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-[#1B72FF] font-medium">재생성 중...</span>
      </div>
    </div>
  );
}

export default function ArticleTab({
  article,
  regeneratingId,
  onRegenerate,
  onRegenerateWithFeedback,
}: ArticleTabProps) {
  const [feedbackOpenId, setFeedbackOpenId] = useState<string | null>(null);
  const isAnyRegenerating = regeneratingId !== null;

  useEffect(() => {
    if (regeneratingId === null) {
      setFeedbackOpenId(null);
    }
  }, [regeneratingId]);

  return (
    <div>
      {/* Title */}
      <h1 className="text-[28px] font-bold leading-tight mb-3" style={{ color: "#0F172A" }}>
        {article.title}
      </h1>
      <div className="text-xs text-gray-400 mb-8">AI 생성 아티클 · HRD 블로그</div>

      {/* Intro */}
      <div className="relative group mb-10">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="text-xs font-semibold text-gray-400 tracking-wider uppercase">도입부</div>
          <RegenerateButton onClick={() => onRegenerate("intro")} disabled={isAnyRegenerating} />
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-[15px] text-gray-700 leading-[1.9]">{article.intro}</p>
        </div>
      </div>

      {/* Key Takeaways — 핵심 내용 3가지 */}
      {article.sections.length > 0 && (
        <div className="mb-10 border border-[#B3D4FF] rounded-xl overflow-hidden">
          <div className="px-5 py-3" style={{ background: "#E8F1FF" }}>
            <h3 className="text-sm font-bold" style={{ color: "#0F172A" }}>이 글의 핵심</h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            {article.sections.slice(0, 3).map((sec, idx) => (
              <div key={sec.id} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1B72FF" }}>
                  {idx + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{sec.keyPoint}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      {article.sections.map((section, idx) => {
        const isRegenerating = regeneratingId === section.id;
        const isFeedbackOpen = feedbackOpenId === section.id;

        return (
          <div key={section.id} className={`relative mb-12 ${isRegenerating ? "opacity-60" : ""}`}>
            {isRegenerating && <LoadingSpinner />}

            {/* Section heading */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold leading-snug" style={{ color: "#0F172A" }}>
                {idx + 1}. {section.heading}
              </h2>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                <RegenerateButton
                  onClick={() => onRegenerate("section", section.id)}
                  disabled={isAnyRegenerating}
                />
                <button
                  onClick={() => setFeedbackOpenId(isFeedbackOpen ? null : section.id)}
                  disabled={isAnyRegenerating}
                  className="text-xs text-gray-400 hover:text-[#1B72FF] border border-gray-200 hover:border-[#B3D4FF] px-2.5 py-1 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💬 수정요청
                </button>
              </div>
            </div>

            {/* Body — styled article content */}
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(section.body) }}
            />

            {/* Feedback inline */}
            {isFeedbackOpen && (
              <FeedbackInline
                onSubmit={(feedback) => {
                  onRegenerateWithFeedback("section", section.id, feedback);
                  setFeedbackOpenId(null);
                }}
                onCancel={() => setFeedbackOpenId(null)}
              />
            )}
          </div>
        );
      })}

      {/* Divider */}
      <hr className="border-t border-gray-200 my-10" />

      {/* Outro */}
      <div className="relative group mb-10">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="text-xs font-semibold text-gray-400 tracking-wider uppercase">마무리</div>
          <RegenerateButton onClick={() => onRegenerate("outro")} disabled={isAnyRegenerating} />
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-[15px] text-gray-700 leading-[1.9]">{article.outro}</p>
        </div>
      </div>


    </div>
  );
}
