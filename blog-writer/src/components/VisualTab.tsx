"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Visual, Section } from "@/types";

interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
}

interface VisualTabProps {
  visuals: Visual[];
  sections: Section[];
  onCopied?: () => void;
}

function ImageCard({ image }: { image: UnsplashImage }) {
  return (
    <a
      href={image.unsplashUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg overflow-hidden border border-gray-100 hover:border-[#B3D4FF] hover:shadow-md transition-all duration-150"
    >
      <div className="aspect-[16/10] overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.thumb}
          alt={image.alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-gray-400 truncate">
          📷{" "}
          <a
            href={image.photographerUrl + "?utm_source=hrd_blog_writer&utm_medium=referral"}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1B72FF] underline"
            onClick={(e) => e.stopPropagation()}
          >
            {image.photographer}
          </a>
          <span className="mx-1">·</span>
          <span className="text-gray-300">Unsplash</span>
        </p>
      </div>
    </a>
  );
}

function ImageSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg overflow-hidden border border-gray-100">
          <div className="aspect-[16/10] bg-gray-200 animate-pulse" />
          <div className="px-3 py-2">
            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Convert Korean description to English search terms for Unsplash
function buildSearchQuery(visual: Visual, section?: Section): string {
  const desc = visual.description;

  const termMap: Record<string, string> = {
    "LMS": "learning management system",
    "이러닝": "e-learning online education",
    "온라인 교육": "online education digital learning",
    "교육": "corporate training education",
    "학습": "learning development",
    "AI": "artificial intelligence technology",
    "생성형": "generative AI",
    "진단": "assessment analytics",
    "역량": "competency skills",
    "대시보드": "dashboard analytics data",
    "데이터": "data analytics chart",
    "ROI": "business performance metrics",
    "마이크로러닝": "microlearning mobile learning",
    "블렌디드": "blended learning classroom",
    "콘텐츠": "digital content creation",
    "플랫폼": "digital platform technology",
    "자동화": "automation workflow",
    "성과": "performance growth",
    "전략": "business strategy planning",
    "체크리스트": "checklist planning organize",
    "비교": "comparison analysis",
    "프로세스": "process workflow steps",
    "도입": "implementation setup",
    "운영": "operations management",
    "팀": "team collaboration workplace",
    "사무실": "modern office workspace",
    "회의": "business meeting conference",
    "노트북": "laptop computer work",
  };

  const matches: string[] = [];
  for (const [kr, en] of Object.entries(termMap)) {
    if (desc.includes(kr)) {
      matches.push(en);
    }
  }

  if (section?.heading) {
    for (const [kr, en] of Object.entries(termMap)) {
      if (section.heading.includes(kr) && !matches.includes(en)) {
        matches.push(en);
      }
    }
  }

  if (matches.length === 0) {
    return "corporate training education technology";
  }

  return matches.slice(0, 3).join(" ");
}

function ImageSection({
  visual,
  index,
  section,
}: {
  visual: Visual;
  index: number;
  section?: Section;
}) {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(index + 1); // Start each section on a different page to avoid duplicates

  const searchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = buildSearchQuery(visual, section);
      const page = pageRef.current;
      const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}&page=${page}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string })?.error || "이미지 검색 실패");
      }
      const data = await res.json() as { images: UnsplashImage[] };
      setImages(data.images || []);
      pageRef.current = page + 3; // Jump 3 pages ahead for next refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 검색 실패");
    } finally {
      setLoading(false);
    }
  }, [visual, section]);

  useEffect(() => {
    searchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#1B72FF] uppercase tracking-wide">
            {visual.section}
          </span>
          {section && (
            <span className="text-xs text-gray-400 truncate max-w-[200px]">
              — {section.heading}
            </span>
          )}
        </div>
        <button
          onClick={searchImages}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-[#1B72FF] transition-colors disabled:opacity-50"
          title="다른 이미지 검색"
        >
          {loading ? "검색 중..." : "🔄 다른 이미지"}
        </button>
      </div>

      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          {visual.description}
        </p>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        {loading ? (
          <ImageSkeleton />
        ) : images.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">관련 이미지를 찾지 못했습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {images.map((img) => (
              <ImageCard key={img.id} image={img} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisualTab({ visuals, sections }: VisualTabProps) {
  if (!visuals || visuals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        시각화 제안이 없습니다.
      </div>
    );
  }

  const sectionMap = new Map<string, Section>();
  sections.forEach((sec, i) => {
    sectionMap.set(`sec_${i + 1}`, sec);
    sectionMap.set(sec.id, sec);
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        각 섹션에 적합한 무료 이미지를 Unsplash에서 추천합니다. 클릭하면 원본을 다운로드할 수 있습니다.
      </p>
      {visuals.map((visual, index) => (
        <ImageSection
          key={index}
          visual={visual}
          index={index}
          section={sectionMap.get(visual.section)}
        />
      ))}
    </div>
  );
}
