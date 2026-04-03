"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import type {
  AppState,
  Topic,
  TopicGroup,
  Tone,
  CharLength,
  Reader,
  SectionCount,
  Article,
} from "@/types";
import StepIndicator from "@/components/StepIndicator";
import TopicStep from "@/components/TopicStep";
import SettingStep from "@/components/SettingStep";
import ResultStep from "@/components/ResultStep";
import { useToast } from "@/components/Toast";

// ─── State Management ────────────────────────────────────────────────────────

const initialState: AppState = {
  currentStep: 1,
  suggestedTopics: null,
  suggestedGroups: null,
  isLoadingTopics: false,
  selectedTopic: null,
  directKeyword: "",
  tone: "professional",
  charLength: 1500,
  reader: "hrd",
  sectionCount: 4,
  isGenerating: false,
  regeneratingId: null,
  streamingText: "",
  error: null,
  article: null,
  activeTab: "article",
};

type Action =
  | { type: "SET_TOPICS"; payload: Topic[] }
  | { type: "SET_GROUPS"; payload: TopicGroup[] }
  | { type: "SET_LOADING_TOPICS"; payload: boolean }
  | { type: "SELECT_TOPIC"; payload: Topic }
  | { type: "SET_DIRECT_KEYWORD"; payload: string }
  | { type: "SET_TONE"; payload: Tone }
  | { type: "SET_CHAR_LENGTH"; payload: CharLength }
  | { type: "SET_READER"; payload: Reader }
  | { type: "SET_SECTION_COUNT"; payload: SectionCount }
  | { type: "SET_STEP"; payload: 1 | 2 | 3 }
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "SET_REGENERATING_ID"; payload: string | null }
  | { type: "APPEND_STREAMING"; payload: string }
  | { type: "CLEAR_STREAMING" }
  | { type: "SET_ARTICLE"; payload: Article }
  | { type: "SET_ACTIVE_TAB"; payload: "article" | "seo" | "visual" }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_TOPICS":
      return { ...state, suggestedTopics: action.payload };
    case "SET_GROUPS":
      return { ...state, suggestedGroups: action.payload };
    case "SET_LOADING_TOPICS":
      return { ...state, isLoadingTopics: action.payload };
    case "SELECT_TOPIC":
      return { ...state, selectedTopic: action.payload, directKeyword: "" };
    case "SET_DIRECT_KEYWORD":
      return { ...state, directKeyword: action.payload, selectedTopic: null };
    case "SET_TONE":
      return { ...state, tone: action.payload };
    case "SET_CHAR_LENGTH":
      return { ...state, charLength: action.payload };
    case "SET_READER":
      return { ...state, reader: action.payload };
    case "SET_SECTION_COUNT":
      return { ...state, sectionCount: action.payload };
    case "SET_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_GENERATING":
      return { ...state, isGenerating: action.payload };
    case "SET_REGENERATING_ID":
      return { ...state, regeneratingId: action.payload };
    case "APPEND_STREAMING":
      return { ...state, streamingText: state.streamingText + action.payload };
    case "CLEAR_STREAMING":
      return { ...state, streamingText: "" };
    case "SET_ARTICLE":
      return { ...state, article: action.payload };
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { showToast, ToastComponent } = useToast();

  // Fetch topics on mount
  // Track previously shown topics to avoid duplicates on refresh
  const previousTopicsRef = useRef<string[]>([]);

  // Initial load: GET (cached, fast)
  const fetchInitialTopics = useCallback(async () => {
    dispatch({ type: "SET_LOADING_TOPICS", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const res = await fetch("/api/topics");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string })?.error || `서버 오류 (${res.status})`
        );
      }
      const data = (await res.json()) as { groups?: TopicGroup[]; topics?: Topic[] };
      if (data.groups && data.groups.length > 0) {
        dispatch({ type: "SET_GROUPS", payload: data.groups });
        const allTopics = data.groups.flatMap((g) => g.topics);
        dispatch({ type: "SET_TOPICS", payload: allTopics });
        previousTopicsRef.current = allTopics.map((t) => t.title);
      } else if (data.topics) {
        dispatch({ type: "SET_TOPICS", payload: data.topics });
        previousTopicsRef.current = data.topics.map((t) => t.title);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "주제를 불러오지 못했습니다.";
      dispatch({ type: "SET_ERROR", payload: msg });
    } finally {
      dispatch({ type: "SET_LOADING_TOPICS", payload: false });
    }
  }, []);

  // Refresh: POST (fresh generation, no cache)
  const fetchTopics = useCallback(async () => {
    dispatch({ type: "SET_LOADING_TOPICS", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousTopics: previousTopicsRef.current,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string })?.error || `서버 오류 (${res.status})`
        );
      }
      const data = (await res.json()) as { groups?: TopicGroup[]; topics?: Topic[] };
      if (data.groups && data.groups.length > 0) {
        dispatch({ type: "SET_GROUPS", payload: data.groups });
        const allTopics = data.groups.flatMap((g) => g.topics);
        dispatch({ type: "SET_TOPICS", payload: allTopics });
        previousTopicsRef.current = [
          ...previousTopicsRef.current,
          ...allTopics.map((t) => t.title),
        ].slice(-30);
      } else if (data.topics) {
        dispatch({ type: "SET_TOPICS", payload: data.topics });
        previousTopicsRef.current = [
          ...previousTopicsRef.current,
          ...data.topics.map((t) => t.title),
        ].slice(-30);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "주제를 불러오지 못했습니다.";
      dispatch({ type: "SET_ERROR", payload: msg });
    } finally {
      dispatch({ type: "SET_LOADING_TOPICS", payload: false });
    }
  }, []);

  useEffect(() => {
    fetchInitialTopics();
  }, [fetchInitialTopics]);

  // Generate article via multi-step API calls
  const generateArticle = useCallback(async () => {
    if (!state.selectedTopic && !state.directKeyword.trim()) return;

    dispatch({ type: "SET_GENERATING", payload: true });
    dispatch({ type: "CLEAR_STREAMING" });
    dispatch({ type: "SET_STEP", payload: 3 });
    dispatch({ type: "SET_ERROR", payload: null });

    const apiPost = async (body: Record<string, unknown>) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string })?.error || `생성 오류 (${res.status})`);
      }
      return res.json();
    };

    try {
      const keyword = state.selectedTopic?.title || state.directKeyword;
      const charPerSection = Math.round(state.charLength / state.sectionCount);

      // Step 1: Outline + Meta (parallel, single API call)
      dispatch({ type: "APPEND_STREAMING", payload: "아웃라인 생성 중..." });
      const { outline, meta } = await apiPost({
        step: "outline",
        topic: state.selectedTopic,
        directKeyword: state.directKeyword,
        tone: state.tone,
        charLength: state.charLength,
        reader: state.reader,
        sectionCount: state.sectionCount,
      });

      // Step 2: Generate each section (separate API call per section)
      const sections = [];
      for (let i = 0; i < outline.headings.length; i++) {
        const h = outline.headings[i];
        dispatch({ type: "CLEAR_STREAMING" });
        dispatch({ type: "APPEND_STREAMING", payload: `섹션 ${i + 1}/${outline.headings.length} 생성 중...` });

        const { section } = await apiPost({
          step: "section",
          keyword,
          tone: state.tone,
          reader: state.reader,
          heading: h.heading,
          keyMessage: h.keyMessage,
          charPerSection,
          prevHeading: i > 0 ? outline.headings[i - 1].heading : undefined,
          nextHeading: i < outline.headings.length - 1 ? outline.headings[i + 1].heading : undefined,
        });

        sections.push({ id: h.id, heading: h.heading, ...section });
      }

      // Step 3: Assemble final article
      const article: Article = {
        title: outline.title,
        intro: outline.intro,
        sections,
        outro: outline.outro,
        faq: meta.faq ?? [],
        seo: meta.seo ?? { metaTitle: "", metaDesc: "", primaryKeyword: "", secondaryKeywords: [], geoTips: [] },
        visuals: meta.visuals ?? [],
      };

      dispatch({ type: "SET_ARTICLE", payload: article });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "아티클 생성에 실패했습니다.";
      dispatch({ type: "SET_ERROR", payload: msg });
      dispatch({ type: "SET_STEP", payload: 2 });
    } finally {
      dispatch({ type: "SET_GENERATING", payload: false });
    }
  }, [
    state.selectedTopic,
    state.directKeyword,
    state.tone,
    state.charLength,
    state.reader,
    state.sectionCount,
  ]);

  // Regenerate a section
  const handleRegenerate = useCallback(
    async (type: string, sectionId?: string) => {
      if (!state.article) return;

      const id = sectionId || type;
      dispatch({ type: "SET_REGENERATING_ID", payload: id });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const res = await fetch("/api/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            sectionId,
            article: state.article,
            topic: state.selectedTopic,
            directKeyword: state.directKeyword,
            tone: state.tone,
            reader: state.reader,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string })?.error || "재생성 오류");
        }

        const data = (await res.json()) as { article?: Article };
        if (data.article) {
          dispatch({ type: "SET_ARTICLE", payload: data.article });
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "재생성에 실패했습니다.";
        dispatch({ type: "SET_ERROR", payload: msg });
      } finally {
        dispatch({ type: "SET_REGENERATING_ID", payload: null });
      }
    },
    [
      state.article,
      state.selectedTopic,
      state.directKeyword,
      state.tone,
      state.reader,
    ]
  );

  // Regenerate with feedback
  const handleRegenerateWithFeedback = useCallback(
    async (type: string, sectionId: string, feedback: string) => {
      if (!state.article) return;

      dispatch({ type: "SET_REGENERATING_ID", payload: sectionId });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        const res = await fetch("/api/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            sectionId,
            feedback,
            article: state.article,
            topic: state.selectedTopic,
            directKeyword: state.directKeyword,
            tone: state.tone,
            reader: state.reader,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            (data as { error?: string })?.error || "수정 요청 오류"
          );
        }

        const data = (await res.json()) as { article?: Article };
        if (data.article) {
          dispatch({ type: "SET_ARTICLE", payload: data.article });
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "수정 반영에 실패했습니다.";
        dispatch({ type: "SET_ERROR", payload: msg });
      } finally {
        dispatch({ type: "SET_REGENERATING_ID", payload: null });
      }
    },
    [
      state.article,
      state.selectedTopic,
      state.directKeyword,
      state.tone,
      state.reader,
    ]
  );

  const handleNext = () => {
    if (state.currentStep === 1) {
      dispatch({ type: "SET_STEP", payload: 2 });
    }
  };

  const handleBack = () => {
    if (state.currentStep === 2) {
      dispatch({ type: "SET_STEP", payload: 1 });
    }
  };

  const handleNewArticle = () => {
    dispatch({ type: "RESET" });
    fetchTopics();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              HRD 블로그 아티클 라이터
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              AI 기반 HRD 마케팅 콘텐츠 자동화
            </p>
          </div>
          <StepIndicator currentStep={state.currentStep} />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Error banner */}
        {state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <span className="text-red-500 text-lg shrink-0">!</span>
            <div>
              <p className="text-sm font-semibold text-red-800">오류 발생</p>
              <p className="text-sm text-red-600 mt-0.5">{state.error}</p>
            </div>
            <button
              onClick={() => dispatch({ type: "SET_ERROR", payload: null })}
              className="ml-auto text-red-400 hover:text-red-600 shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Steps */}
        {state.currentStep === 1 && (
          <TopicStep
            topics={state.suggestedTopics}
            groups={state.suggestedGroups}
            isLoading={state.isLoadingTopics}
            selectedTopic={state.selectedTopic}
            directKeyword={state.directKeyword}
            onSelectTopic={(topic) =>
              dispatch({ type: "SELECT_TOPIC", payload: topic })
            }
            onDirectInput={(value) =>
              dispatch({ type: "SET_DIRECT_KEYWORD", payload: value })
            }
            onRefresh={fetchTopics}
            onNext={handleNext}
          />
        )}

        {state.currentStep === 2 && (
          <SettingStep
            selectedTopic={state.selectedTopic}
            directKeyword={state.directKeyword}
            tone={state.tone}
            charLength={state.charLength}
            reader={state.reader}
            sectionCount={state.sectionCount}
            onChangeTone={(tone) =>
              dispatch({ type: "SET_TONE", payload: tone })
            }
            onChangeLength={(len) =>
              dispatch({ type: "SET_CHAR_LENGTH", payload: len })
            }
            onChangeReader={(reader) =>
              dispatch({ type: "SET_READER", payload: reader })
            }
            onChangeSectionCount={(count) =>
              dispatch({ type: "SET_SECTION_COUNT", payload: count })
            }
            onBack={handleBack}
            onGenerate={generateArticle}
            isGenerating={state.isGenerating}
          />
        )}

        {state.currentStep === 3 && (
          <ResultStep
            article={state.article}
            activeTab={state.activeTab}
            isGenerating={state.isGenerating}
            regeneratingId={state.regeneratingId}
            onTabChange={(tab) =>
              dispatch({ type: "SET_ACTIVE_TAB", payload: tab })
            }
            onRegenerate={handleRegenerate}
            onRegenerateWithFeedback={handleRegenerateWithFeedback}
            onNewArticle={handleNewArticle}
            onCopied={() => showToast()}
          />
        )}
      </main>

      {ToastComponent}
    </div>
  );
}
