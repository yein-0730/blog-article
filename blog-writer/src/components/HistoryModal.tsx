"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Article } from "@/types";

interface HistoryItem {
  id: string;
  title: string;
  keyword: string | null;
  tone: string | null;
  reader: string | null;
  article: Article;
  created_at: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (article: Article) => void;
}

const TONE_LABELS: Record<string, string> = {
  professional: "전문적",
  friendly: "친근한",
  challenging: "도전적",
};

const READER_LABELS: Record<string, string> = {
  hrd: "HRD 담당자",
  clo: "CLO·교육팀장",
  hrPlanner: "HR 기획자",
  eduOperator: "교육 운영자",
};

export default function HistoryModal({ isOpen, onClose, onLoad }: HistoryModalProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    loadHistory();
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("article_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      setItems(data as HistoryItem[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("article_history").delete().eq("id", id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${month}/${day} ${hours}:${mins}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">아티클 히스토리</h2>
            <p className="text-xs text-gray-400 mt-0.5">최근 생성한 아티클 목록</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="overflow-auto flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-[#1B72FF] rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">아직 생성한 아티클이 없습니다.</p>
              <p className="text-gray-300 text-xs mt-1">아티클을 생성하면 자동으로 저장됩니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-100 rounded-xl p-4 hover:border-[#B3D4FF] hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => {
                    onLoad(item.article);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>
                        {item.tone && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {TONE_LABELS[item.tone] ?? item.tone}
                          </span>
                        )}
                        {item.reader && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {READER_LABELS[item.reader] ?? item.reader}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoad(item.article);
                          onClose();
                        }}
                        className="text-xs text-[#1B72FF] hover:text-[#1456CC] font-medium px-2 py-1 rounded hover:bg-[#E8F1FF] transition-colors"
                      >
                        불러오기
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="text-xs text-gray-300 hover:text-red-500 px-1.5 py-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
