"use client";

import type { Article } from "@/types";
import ArticleTab from "./ArticleTab";
import SeoTab from "./SeoTab";
import VisualTab from "./VisualTab";
import { exportMarkdown, exportHTML, copyToClipboard } from "@/lib/export";

interface ResultStepProps {
  article: Article | null;
  activeTab: "article" | "seo" | "visual";
  isGenerating: boolean;
  streamingText: string;
  regeneratingId: string | null;
  onTabChange: (tab: "article" | "seo" | "visual") => void;
  onRegenerate: (type: string, sectionId?: string) => void;
  onRegenerateWithFeedback: (
    type: string,
    sectionId: string,
    feedback: string
  ) => void;
  onNewArticle: () => void;
  onCopied: () => void;
}

const TABS: { id: "article" | "seo" | "visual"; label: string }[] = [
  { id: "article", label: "📝 본문" },
  { id: "seo", label: "🔍 SEO·AEO·GEO" },
  { id: "visual", label: "🎨 시각화" },
];

export default function ResultStep({
  article,
  activeTab,
  isGenerating,
  streamingText,
  regeneratingId,
  onTabChange,
  onRegenerate,
  onRegenerateWithFeedback,
  onNewArticle,
  onCopied,
}: ResultStepProps) {
  const handleCopyMarkdown = async () => {
    if (!article) return;
    const md = exportMarkdown(article);
    await copyToClipboard(md);
    onCopied();
  };

  const handleCopyHTML = async () => {
    if (!article) return;
    const md = exportMarkdown(article);
    const html = exportHTML(article);
    await copyToClipboard(md, html);
    onCopied();
  };

  const handleDownloadHTML = () => {
    if (!article) return;
    const html = exportFullHTML(article);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${article.title.replace(/[^가-힣a-zA-Z0-9 ]/g, "").trim()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isGenerating || !article) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24">
          {/* Spinner */}
          <svg className="animate-spin w-10 h-10 text-[#1B72FF] mb-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            블로그 아티클 작성 중
          </h3>
          <p className="text-sm text-gray-400">
            AI가 블로그 아티클을 생성 중입니다. 약 30~60초 정도 소요됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-5 py-3 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-[#1B72FF] text-[#1B72FF]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mb-10">
        {activeTab === "article" && (
          <ArticleTab
            article={article}
            regeneratingId={regeneratingId}
            onRegenerate={onRegenerate}
            onRegenerateWithFeedback={onRegenerateWithFeedback}
          />
        )}
        {activeTab === "seo" && (
          <SeoTab seo={article.seo} onCopied={onCopied} />
        )}
        {activeTab === "visual" && (
          <VisualTab
            visuals={article.visuals}
            sections={article.sections}
            onCopied={onCopied}
          />
        )}
      </div>

      {/* Bottom action bar */}
      <div className="border-t border-gray-200 pt-5 flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onNewArticle}
          className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-4 py-2.5 rounded-xl transition-all duration-150 bg-white"
        >
          ← 새 아티클 작성
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#1B72FF] border border-gray-200 hover:border-[#B3D4FF] px-4 py-2.5 rounded-xl transition-all duration-150 bg-white hover:bg-[#E8F1FF]"
          >
            📋 마크다운 복사
          </button>
          <button
            onClick={handleCopyHTML}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#1B72FF] border border-gray-200 hover:border-[#B3D4FF] px-4 py-2.5 rounded-xl transition-all duration-150 bg-white hover:bg-[#E8F1FF]"
          >
            📋 HTML 복사
          </button>
          <button
            onClick={handleDownloadHTML}
            className="flex items-center gap-1.5 text-sm font-medium text-white bg-[#1B72FF] hover:bg-[#1456CC] px-4 py-2.5 rounded-xl transition-all duration-150 shadow-sm"
          >
            ⬇ HTML 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}

/** Generate a standalone HTML file styled like FastCampus blog */
function exportFullHTML(article: Article): string {
  const { marked } = require("marked");

  const renderSection = (sec: typeof article.sections[0], idx: number) => {
    const bodyHtml = marked.parse(sec.body || "");
    return `
    <section class="section">
      <h2 class="section-heading">${idx + 1}. ${sec.heading}</h2>
      <div class="direct-answer">
        <p>${sec.directAnswer}</p>
      </div>
      <div class="section-body">${bodyHtml}</div>
      <div class="key-point">
        <span class="key-point-label">핵심</span> ${sec.keyPoint}
      </div>
    </section>`;
  };

  const faqHtml = (article.faq || [])
    .map(
      (f) => `
    <div class="faq-item">
      <h3 class="faq-q">Q. ${f.question}</h3>
      <p class="faq-a">${f.answer}</p>
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${article.title}</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Pretendard Variable', 'Noto Sans KR', sans-serif;
    color: #222; background: #fff; line-height: 1.8;
    max-width: 760px; margin: 0 auto; padding: 40px 24px;
  }
  h1 { font-size: 28px; font-weight: 700; color: #0F172A; margin-bottom: 12px; line-height: 1.4; }
  .meta { font-size: 13px; color: #888; margin-bottom: 32px; }
  .intro { font-size: 16px; color: #333; margin-bottom: 40px; padding: 24px; background: #F8F9FA; border-radius: 12px; line-height: 1.9; }
  .section { margin-bottom: 48px; }
  .section-heading { font-size: 20px; font-weight: 700; color: #0F172A; margin-bottom: 16px; line-height: 1.5; }
  .direct-answer { background: #E8F1FF; border-left: 4px solid #1B72FF; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
  .direct-answer p { font-size: 15px; font-weight: 500; color: #1a1a1a; line-height: 1.7; margin: 0; }
  .section-body { font-size: 15px; color: #333; line-height: 1.9; }
  .section-body p { margin-bottom: 16px; }
  .section-body strong, .section-body b { color: #0F172A; font-weight: 600; }
  .section-body ul, .section-body ol { padding-left: 24px; margin-bottom: 16px; }
  .section-body li { margin-bottom: 8px; }
  .section-body table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
  .section-body th { background: #0F172A; color: #fff; padding: 12px 16px; text-align: left; font-weight: 600; }
  .section-body td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
  .section-body tr:nth-child(even) td { background: #F8F9FA; }
  .section-body blockquote { border-left: 3px solid #1B72FF; padding: 12px 20px; margin: 16px 0; background: #f8faff; color: #555; font-style: italic; }
  .key-point { background: #FFF8E1; border-radius: 8px; padding: 12px 16px; margin-top: 16px; font-size: 14px; color: #6d5e00; }
  .key-point-label { background: #FFD600; color: #000; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-right: 8px; }
  .outro { font-size: 16px; color: #333; padding: 24px; background: #F8F9FA; border-radius: 12px; margin-bottom: 40px; line-height: 1.9; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 40px 0; }
  .faq { margin-bottom: 40px; }
  .faq h2 { font-size: 20px; font-weight: 700; color: #0F172A; margin-bottom: 20px; }
  .section-body a { color: #1B72FF; text-decoration: underline; text-underline-offset: 2px; }
  .section-body a:hover { color: #1456CC; }
  .faq-item { background: #F8F9FA; border-radius: 12px; padding: 20px; margin-bottom: 12px; }
  .faq-q { font-size: 15px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; }
  .faq-a { font-size: 14px; color: #555; line-height: 1.8; }
</style>
</head>
<body>
  <h1>${article.title}</h1>
  <div class="meta">AI 생성 아티클 · HRD 블로그</div>
  <div class="intro">${article.intro}</div>

  ${article.sections.map(renderSection).join("")}

  <hr class="divider" />
  <div class="outro">${article.outro}</div>

  ${
    article.faq && article.faq.length > 0
      ? `<hr class="divider" /><div class="faq"><h2>자주 묻는 질문</h2>${faqHtml}</div>`
      : ""
  }
</body>
</html>`;
}
