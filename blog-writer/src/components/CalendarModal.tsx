"use client";

import { useState } from "react";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CURRENT_MONTH = new Date().getMonth() + 1;

interface CalendarRow {
  label: string;
  color: string;
  data: Record<number, string[]>;
}

const CALENDAR_DATA: CalendarRow[] = [
  {
    label: "인사관리·사내행사",
    color: "bg-amber-50 text-amber-800",
    data: {
      1: ["시무식", "채용 일정 계획 수립", "연차계획 수립"],
      2: ["채용 일정 계획", "사업장 건강검진", "외부감사 종료"],
      3: ["승진자 발표", "맞춤 교육 계획 수립"],
      4: ["조직 활성화", "워크숍"],
      5: ["성과 중간점검", "재정비 기간", "중간관리자 리더십"],
      6: ["연차사용 촉진제도 (1차)"],
      7: ["성과관리 리뷰", "상반기 성과 리뷰", "하반기 목표 정립"],
      8: ["하계 휴가"],
      9: ["조직문화 진단 및 개선", "추석선물 준비"],
      10: ["연차사용 촉진제도 (2차)", "법정의무교육"],
      11: ["성과평가", "미사용 연차 파악", "법정의무교육"],
      12: ["당해 법정교육 이수확인", "종무식", "성과급"],
    },
  },
  {
    label: "법정의무교육",
    color: "bg-red-50 text-red-800",
    data: {
      1: ["법정필수교육 시작"],
      2: [],
      3: ["산업안전보건교육 (상반기)"],
      4: ["장애인 인식개선", "개인정보보호"],
      5: ["퇴직연금교육"],
      6: ["산업안전교육 H1 마감"],
      7: ["산업안전보건교육 (하반기)"],
      8: [],
      9: [],
      10: ["법정의무교육 독촉"],
      11: ["미이수자 집중 이수"],
      12: ["법정의무교육 최종 마감 (벌금 주의)"],
    },
  },
  {
    label: "신규입사자 교육",
    color: "bg-blue-50 text-blue-800",
    data: {
      1: [],
      2: ["입문 및 업무수행 교육"],
      3: ["온보딩 교육", "신입사원 교육"],
      4: ["커뮤니케이션 교육"],
      5: ["상반기 공채 온보딩 시작"],
      6: [],
      7: [],
      8: [],
      9: ["온보딩 교육"],
      10: ["직장생활 교육"],
      11: ["하반기 공채 온보딩 준비"],
      12: ["하반기 신입 온보딩"],
    },
  },
  {
    label: "스킬 향상 교육",
    color: "bg-green-50 text-green-800",
    data: {
      1: ["보고서 작성 교육", "경력직 온보딩 교육"],
      2: [],
      3: ["비즈니스 스피치, 매너 교육", "팀빌딩 교육"],
      4: ["프레젠테이션 교육"],
      5: ["기획력 교육"],
      6: [],
      7: ["성과관리 교육"],
      8: [],
      9: [],
      10: [],
      11: [],
      12: ["직무 역량 강화 교육"],
    },
  },
  {
    label: "성과평가",
    color: "bg-purple-50 text-purple-800",
    data: {
      1: ["목표 수립"],
      2: [],
      3: [],
      4: [],
      5: [],
      6: ["상반기 평가"],
      7: [],
      8: [],
      9: [],
      10: [],
      11: [],
      12: ["하반기 평가"],
    },
  },
  {
    label: "채용",
    color: "bg-orange-50 text-orange-800",
    data: {
      1: ["교육실행 및 채용계획 수립"],
      2: ["상반기 채용"],
      3: ["상반기 채용 피크"],
      4: [],
      5: ["최종 합격·입사"],
      6: [],
      7: [],
      8: [],
      9: ["하반기 채용"],
      10: ["하반기 채용 피크"],
      11: ["최종 합격"],
      12: ["차년도 교육계획 확정"],
    },
  },
];

export default function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF6B4A] to-[#FF8F6B] text-white shrink-0">
          <div>
            <h2 className="text-lg font-bold">한 눈에 확인하는 HRD 캘린더</h2>
            <p className="text-sm opacity-80 mt-0.5">월별 주요 인사·교육 일정</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Calendar table */}
        <div className="overflow-auto flex-1 p-4">
          <table className="w-full border-collapse text-xs min-w-[900px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 border border-gray-200 px-3 py-2.5 text-left text-gray-600 font-semibold w-28 min-w-28">
                  구분
                </th>
                {MONTHS.map((m) => (
                  <th
                    key={m}
                    className={`border border-gray-200 px-2 py-2.5 text-center font-semibold min-w-[72px] ${
                      m === CURRENT_MONTH
                        ? "bg-[#1B72FF] text-white"
                        : "bg-gray-50 text-gray-600"
                    }`}
                    onMouseEnter={() => setHoveredMonth(m)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    {m}월
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CALENDAR_DATA.map((row) => (
                <tr key={row.label}>
                  <td className="sticky left-0 z-10 bg-white border border-gray-200 px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">
                    {row.label}
                  </td>
                  {MONTHS.map((m) => {
                    const items = row.data[m] || [];
                    const isCurrentMonth = m === CURRENT_MONTH;
                    const isHovered = m === hoveredMonth;
                    return (
                      <td
                        key={m}
                        className={`border border-gray-200 px-1.5 py-1.5 align-top transition-colors ${
                          isCurrentMonth
                            ? "bg-blue-50/50"
                            : isHovered
                              ? "bg-gray-50/80"
                              : "bg-white"
                        }`}
                        onMouseEnter={() => setHoveredMonth(m)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      >
                        <div className="flex flex-col gap-0.5">
                          {items.map((item, idx) => (
                            <span
                              key={idx}
                              className={`inline-block px-1.5 py-0.5 rounded text-[11px] leading-tight ${row.color}`}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            * 본 HRD 캘린더는 유관 매뉴얼이므로 상황에 따라 조정하여 운영하시기 바랍니다.
          </p>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
