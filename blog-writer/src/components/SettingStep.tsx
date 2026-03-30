"use client";

import type { Topic, Tone, CharLength, Reader, SectionCount } from "@/types";

interface SettingStepProps {
  selectedTopic: Topic | null;
  directKeyword: string;
  tone: Tone;
  charLength: CharLength;
  reader: Reader;
  sectionCount: SectionCount;
  onChangeTone: (tone: Tone) => void;
  onChangeLength: (len: CharLength) => void;
  onChangeReader: (reader: Reader) => void;
  onChangeSectionCount: (count: SectionCount) => void;
  onBack: () => void;
  onGenerate: () => void;
  isGenerating?: boolean;
}

const TONES: { value: Tone; emoji: string; title: string; desc: string }[] = [
  {
    value: "professional",
    emoji: "📊",
    title: "전문적·신뢰감",
    desc: "데이터와 프레임워크 중심의 객관적 서술",
  },
  {
    value: "friendly",
    emoji: "💬",
    title: "친근·실용적",
    desc: "실무자 눈높이의 가이드형 콘텐츠",
  },
  {
    value: "challenging",
    emoji: "💡",
    title: "도전적·인사이트형",
    desc: "기존 관점을 뒤집는 도전적 시각",
  },
];

const LENGTHS: CharLength[] = [800, 1500, 2500];

const READERS: { value: Reader; label: string }[] = [
  { value: "hrd", label: "HRD 담당자" },
  { value: "clo", label: "CLO·교육팀장" },
  { value: "hrPlanner", label: "HR 기획자" },
  { value: "eduOperator", label: "교육 운영자" },
];

const SECTION_COUNTS: SectionCount[] = [3, 4, 5];

export default function SettingStep({
  selectedTopic,
  directKeyword,
  tone,
  charLength,
  reader,
  sectionCount,
  onChangeTone,
  onChangeLength,
  onChangeReader,
  onChangeSectionCount,
  onBack,
  onGenerate,
  isGenerating = false,
}: SettingStepProps) {
  const topicDisplay = selectedTopic?.title || directKeyword || "";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Selected topic display */}
      <div className="bg-[#E8F1FF] border border-[#B3D4FF] rounded-xl px-5 py-4">
        <p className="text-xs text-[#1B72FF] font-semibold uppercase tracking-wide mb-1">
          선택된 주제
        </p>
        <p className="text-[#0F172A] font-semibold text-base leading-snug">
          {topicDisplay}
        </p>
      </div>

      {/* Tone selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          글쓰기 톤
        </label>
        <div className="grid grid-cols-3 gap-3">
          {TONES.map((t) => (
            <button
              key={t.value}
              onClick={() => onChangeTone(t.value)}
              className={`border rounded-xl p-4 text-left transition-all duration-150 ${
                tone === t.value
                  ? "border-[#1B72FF] bg-[#E8F1FF] ring-1 ring-[#B3D4FF] shadow-sm"
                  : "border-gray-200 bg-white hover:border-[#B3D4FF] hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl block mb-2">{t.emoji}</span>
              <span className="block text-sm font-semibold text-gray-900 mb-1">
                {t.title}
              </span>
              <span className="block text-xs text-gray-500 leading-snug">
                {t.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Length selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          아티클 분량
        </label>
        <div className="flex gap-3">
          {LENGTHS.map((len) => (
            <button
              key={len}
              onClick={() => onChangeLength(len)}
              className={`flex-1 border rounded-xl py-3 text-sm font-semibold transition-all duration-150 ${
                charLength === len
                  ? "border-[#1B72FF] bg-[#1B72FF] text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:border-[#B3D4FF] hover:text-[#1B72FF]"
              }`}
            >
              {len.toLocaleString()}자
            </button>
          ))}
        </div>
      </div>

      {/* Reader dropdown */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          대상 독자
        </label>
        <select
          value={reader}
          onChange={(e) => onChangeReader(e.target.value as Reader)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#B3D4FF] focus:border-[#1B72FF] transition-all duration-150 cursor-pointer"
        >
          {READERS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Section count dropdown */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">
          섹션 수
        </label>
        <select
          value={sectionCount}
          onChange={(e) =>
            onChangeSectionCount(Number(e.target.value) as SectionCount)
          }
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#B3D4FF] focus:border-[#1B72FF] transition-all duration-150 cursor-pointer"
        >
          {SECTION_COUNTS.map((c) => (
            <option key={c} value={c}>
              {c}개
            </option>
          ))}
        </select>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-50"
        >
          ← 이전
        </button>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-[#1B72FF] hover:bg-[#1456CC] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              생성 중...
            </>
          ) : (
            "🚀 아티클 생성하기"
          )}
        </button>
      </div>
    </div>
  );
}
