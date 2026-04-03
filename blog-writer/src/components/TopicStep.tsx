"use client";

import type { Topic } from "@/types";

interface TopicStepProps {
  topics: Topic[] | null;
  isLoading: boolean;
  onSelectTopic: (topic: Topic) => void;
  onDirectInput: (value: string) => void;
  onRefresh: () => void;
  onNext: () => void;
  directKeyword: string;
  selectedTopic: Topic | null;
}

const MONTH = new Date().getMonth() + 1;
const HRD_BANNERS: Record<number, string> = {
  1: "연간 교육 계획 실행 · 예산 우선순위 결정 · AI 교육 로드맵",
  2: "신입사원 온보딩 설계 · 교육 니즈 취합 · MZ세대 AI 교육",
  3: "법정교육 시작 · 신입사원 온보딩 · 신임 관리자 교육",
  4: "LMS 교체 검토 · 법정의무교육 실시 · AI 교육 벤치마크",
  5: "대규모 온보딩 운영 · 합숙→온라인 전환 · AI 실습 교육",
  6: "상반기 성과 평가 · 안전교육 마감 · 하반기 교육 기획",
  7: "하반기 교육 시작 · 임원 AI 전략교육 · 승진자 역량 진단",
  8: "휴가철 이수율 관리 · 마이크로러닝 · AI 콘텐츠 제작",
  9: "내년 교육 계획 착수 · 역량 진단(TNA) · AI 교육 로드맵",
  10: "내년 예산 확보 · 교육 ROI 입증 · AI 교육 투자 근거",
  11: "법정의무교육 마감 · 연간 성과 보고 · 내년 계획 확정",
  12: "LMS 갱신 결정 · 인사평가↔교육 연동 · 내년 AI 교육 확정",
};

function TopicCardSkeleton() {
  return (
    <div className="border border-gray-100 rounded-xl p-5 bg-white animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-4 bg-gray-100 rounded w-full mb-2" />
      <div className="h-4 bg-gray-100 rounded w-5/6 mb-4" />
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-[#E8F1FF] rounded-full" />
        <div className="h-6 w-20 bg-[#E8F1FF] rounded-full" />
        <div className="h-6 w-14 bg-[#E8F1FF] rounded-full" />
      </div>
    </div>
  );
}

export default function TopicStep({
  topics,
  isLoading,
  onSelectTopic,
  onDirectInput,
  onRefresh,
  onNext,
  directKeyword,
  selectedTopic,
}: TopicStepProps) {
  const canProceed = selectedTopic !== null || directKeyword.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Seasonal banner */}
      <div className="bg-[#E8F1FF] border border-[#B3D4FF] rounded-xl px-5 py-3 mb-6 flex items-center gap-2">
        <span className="text-[#1B72FF] text-sm font-semibold">
          {MONTH}월 추천 주제
        </span>
        <span className="text-gray-400 text-sm">·</span>
        <span className="text-gray-600 text-sm">{HRD_BANNERS[MONTH]}</span>
      </div>

      {/* Topic cards */}
      <div className="grid grid-cols-1 gap-4 mb-5">
        {isLoading || !topics
          ? Array.from({ length: 5 }).map((_, i) => (
              <TopicCardSkeleton key={i} />
            ))
          : topics.map((topic, index) => {
              const isSelected = selectedTopic?.title === topic.title;
              return (
                <div
                  key={index}
                  className={`border rounded-xl p-5 bg-white transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-[#1B72FF] shadow-md ring-1 ring-[#B3D4FF]"
                      : "border-gray-100 hover:border-[#B3D4FF] hover:shadow-sm"
                  }`}
                  onClick={() => onSelectTopic(topic)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 font-semibold text-base mb-1.5 leading-snug">
                        {topic.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-3">
                        {topic.angle}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {topic.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="bg-[#E8F1FF] text-[#1B72FF] text-xs font-medium px-2.5 py-0.5 rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTopic(topic);
                        onNext();
                      }}
                      className="shrink-0 bg-[#1B72FF] hover:bg-[#1456CC] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150 whitespace-nowrap"
                    >
                      이 주제로 →
                    </button>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Refresh button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B72FF] border border-gray-200 hover:border-[#B3D4FF] px-4 py-2 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
        >
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-[#1B72FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          )}
          {isLoading ? "추천 중..." : "다른 주제 추천받기"}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-400 text-sm shrink-0">또는 직접 입력</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Direct keyword input */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          키워드 직접 입력
        </label>
        <textarea
          value={directKeyword}
          onChange={(e) => onDirectInput(e.target.value)}
          placeholder="예) 사내 코칭 문화 정착, AI 기반 역량 진단, 블렌디드 러닝 전략..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B3D4FF] focus:border-[#1B72FF] resize-none transition-all duration-150"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          작성하고 싶은 주제나 키워드를 자유롭게 입력하세요.
        </p>
      </div>

      {/* Next button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-[#1B72FF] hover:bg-[#1456CC] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
