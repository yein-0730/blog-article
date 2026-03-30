"use client";

import type { Visual, Section } from "@/types";

interface VisualTabProps {
  visuals: Visual[];
  sections: Section[];
  onCopied?: () => void;
}

function CopyButton({ text, onCopied }: { text: string; onCopied?: () => void }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      onCopied?.();
    } catch {
      // silent fail
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-gray-400 hover:text-[#1B72FF] border border-gray-200 hover:border-[#B3D4FF] px-2.5 py-1 rounded-lg transition-all duration-150"
      title="복사"
    >
      복사
    </button>
  );
}

export default function VisualTab({ visuals, sections: _sections, onCopied }: VisualTabProps) {
  if (!visuals || visuals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        시각화 제안이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        각 섹션에 적합한 시각 자료 제안입니다. 영문 프롬프트를 이미지 생성 AI에 사용하세요.
      </p>
      {visuals.map((visual, index) => (
        <div
          key={index}
          className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm"
        >
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#1B72FF] uppercase tracking-wide">
                {visual.section}
              </span>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              이미지 {index + 1}
            </span>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Korean description */}
            <div>
              <p className="text-xs text-gray-500 mb-1.5">내용 설명</p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {visual.description}
              </p>
            </div>

            {/* English prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-gray-500">영문 생성 프롬프트</p>
                <CopyButton text={visual.prompt} onCopied={onCopied} />
              </div>
              <div className="bg-gray-900 rounded-xl px-4 py-3 font-mono text-xs text-green-400 leading-relaxed break-words whitespace-pre-wrap">
                {visual.prompt}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
