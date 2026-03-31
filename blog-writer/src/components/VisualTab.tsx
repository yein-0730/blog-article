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

// Track all fetched image IDs across sections to prevent duplicates
const globalSeenIds = new Set<string>();

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
function buildSearchQuery(visual: Visual, section?: Section, variation?: number): string {
  const desc = visual.description;

  const termMap: Record<string, string[]> = {
    "LMS": ["learning management system", "LMS platform education", "online learning platform"],
    "이러닝": ["e-learning online education", "digital learning classroom", "remote education technology"],
    "온라인 교육": ["online education digital learning", "virtual classroom training", "distance learning"],
    "교육": ["corporate training education", "professional development workshop", "employee training session"],
    "학습": ["learning development", "study knowledge growth", "skill building education"],
    "AI": ["artificial intelligence technology", "AI machine learning", "smart technology innovation"],
    "생성형": ["generative AI technology", "AI content creation", "artificial intelligence automation"],
    "진단": ["assessment analytics evaluation", "diagnostic analysis data", "skills assessment testing"],
    "역량": ["competency skills development", "professional capability growth", "talent management"],
    "대시보드": ["dashboard analytics data visualization", "business intelligence dashboard", "data analytics screen"],
    "데이터": ["data analytics chart visualization", "business data analysis", "data science graphs"],
    "ROI": ["business performance metrics ROI", "return investment growth", "financial performance chart"],
    "마이크로러닝": ["microlearning mobile education", "bite-sized learning mobile", "short form education"],
    "블렌디드": ["blended learning classroom online", "hybrid education model", "mixed learning approach"],
    "콘텐츠": ["digital content creation design", "content strategy media", "creative content production"],
    "플랫폼": ["digital platform technology interface", "software platform design", "technology platform screen"],
    "자동화": ["automation workflow efficiency", "process automation technology", "automated system workflow"],
    "성과": ["performance growth achievement", "business results success", "goal achievement progress"],
    "전략": ["business strategy planning board", "strategic planning leadership", "corporate strategy meeting"],
    "체크리스트": ["checklist planning organization", "task management planning", "organized workflow checklist"],
    "비교": ["comparison analysis evaluation", "side by side comparison", "benchmark analysis chart"],
    "프로세스": ["process workflow steps diagram", "business process flowchart", "workflow management system"],
    "도입": ["implementation setup launch", "system deployment introduction", "technology adoption"],
    "운영": ["operations management team", "business operations workflow", "organizational management"],
    "팀": ["team collaboration workplace office", "teamwork collaboration meeting", "diverse team working"],
    "사무실": ["modern office workspace design", "contemporary workspace interior", "professional office environment"],
    "회의": ["business meeting conference room", "professional meeting discussion", "corporate conference team"],
    "노트북": ["laptop computer work professional", "working on laptop office", "digital workspace laptop"],
  };

  const matches: string[][] = [];
  for (const [kr, enOptions] of Object.entries(termMap)) {
    if (desc.includes(kr)) {
      matches.push(enOptions);
    }
  }

  if (section?.heading) {
    for (const [kr, enOptions] of Object.entries(termMap)) {
      if (section.heading.includes(kr) && !matches.some(m => m === enOptions)) {
        matches.push(enOptions);
      }
    }
  }

  if (matches.length === 0) {
    const fallbacks = [
      "corporate training education technology",
      "professional development workplace",
      "business education innovation",
    ];
    return fallbacks[(variation ?? 0) % fallbacks.length];
  }

  // Pick variation-based terms to ensure different searches per section
  const varIdx = variation ?? 0;
  const selected = matches.slice(0, 3).map((options, i) => {
    const optIdx = (varIdx + i) % options.length;
    return options[optIdx];
  });

  return selected.join(" ");
}

function ImageSection({
  visual,
  index,
  section,
  totalSections,
}: {
  visual: Visual;
  index: number;
  section?: Section;
  totalSections: number;
}) {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Spread starting pages far apart to minimize overlap
  const pageRef = useRef(index * 5 + 1);
  const refreshCountRef = useRef(0);

  const searchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const variation = refreshCountRef.current * totalSections + index;
      const query = buildSearchQuery(visual, section, variation);
      const page = pageRef.current;
      const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}&page=${page}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string })?.error || "이미지 검색 실패");
      }
      const data = await res.json() as { images: UnsplashImage[] };
      const fetched = data.images || [];

      // Filter out images already shown in other sections
      const unique = fetched.filter((img) => !globalSeenIds.has(img.id));
      unique.forEach((img) => globalSeenIds.add(img.id));

      setImages(unique.length > 0 ? unique : fetched);
      // Jump pages significantly for next refresh
      pageRef.current = page + totalSections + 2;
      refreshCountRef.current += 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 검색 실패");
    } finally {
      setLoading(false);
    }
  }, [visual, section, index, totalSections]);

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
          {loading ? "검색 중..." : "다른 이미지"}
        </button>
      </div>

      <div className="px-5 py-4 space-y-3">
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

function ManualSearch() {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);

  const search = useCallback(async (resetPage = true) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    if (resetPage) pageRef.current = 1;
    try {
      const page = pageRef.current;
      const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query.trim())}&page=${page}`);
      if (!res.ok) throw new Error("검색 실패");
      const data = await res.json() as { images: UnsplashImage[] };
      setImages(data.images || []);
      pageRef.current = page + 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : "검색 실패");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      search(true);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-3">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">직접 검색</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="검색어를 입력하세요 (예: office meeting, education technology)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B3D4FF] focus:border-[#1B72FF] transition-all"
          />
          <button
            onClick={() => search(true)}
            disabled={loading || !query.trim()}
            className="shrink-0 bg-[#1B72FF] hover:bg-[#1456CC] disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {images.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {images.map((img) => (
                <ImageCard key={img.id} image={img} />
              ))}
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => search(false)}
                disabled={loading}
                className="text-xs text-gray-400 hover:text-[#1B72FF] border border-gray-200 hover:border-[#B3D4FF] px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? "검색 중..." : "더 보기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VisualTab({ visuals, sections }: VisualTabProps) {
  // Reset global seen IDs when component mounts (new article)
  useEffect(() => {
    globalSeenIds.clear();
  }, []);

  const sectionMap = new Map<string, Section>();
  sections.forEach((sec, i) => {
    sectionMap.set(`sec_${i + 1}`, sec);
    sectionMap.set(sec.id, sec);
  });

  const hasVisuals = visuals && visuals.length > 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        {hasVisuals
          ? "각 섹션에 적합한 무료 이미지를 Unsplash에서 추천합니다. 클릭하면 원본을 다운로드할 수 있습니다."
          : "아래에서 직접 Unsplash 이미지를 검색할 수 있습니다."}
      </p>
      {hasVisuals && visuals.map((visual, index) => (
        <ImageSection
          key={index}
          visual={visual}
          index={index}
          section={sectionMap.get(visual.section)}
          totalSections={visuals.length}
        />
      ))}
      <ManualSearch />
    </div>
  );
}
