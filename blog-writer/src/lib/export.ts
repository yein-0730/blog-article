import type { Article, SEO } from "@/types";

export function exportMarkdown(article: Article): string {
  const lines: string[] = [];

  lines.push(`# ${article.title}`);
  lines.push("");
  lines.push(article.intro);
  lines.push("");

  for (const section of article.sections) {
    lines.push(`## ${section.heading}`);
    lines.push("");
    lines.push(`> ${section.directAnswer}`);
    lines.push("");
    lines.push(section.body);
    lines.push("");
    lines.push(`*${section.keyPoint}*`);
    lines.push("");
  }

  lines.push("## 마무리");
  lines.push("");
  lines.push(article.outro);
  lines.push("");

  if (article.faq.length > 0) {
    lines.push("## 자주 묻는 질문");
    lines.push("");
    for (const item of article.faq) {
      lines.push(`**Q: ${item.question}**`);
      lines.push("");
      lines.push(`A: ${item.answer}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function exportHTML(article: Article): string {
  const lines: string[] = [];

  lines.push("<!DOCTYPE html>");
  lines.push('<html lang="ko">');
  lines.push("<head>");
  lines.push('<meta charset="UTF-8">');
  lines.push(`<title>${escapeHtml(article.title)}</title>`);
  lines.push("</head>");
  lines.push("<body>");
  lines.push(`<h1>${escapeHtml(article.title)}</h1>`);
  lines.push(`<p>${escapeHtml(article.intro)}</p>`);

  for (const section of article.sections) {
    lines.push(`<section>`);
    lines.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    lines.push(
      `<p><strong>${escapeHtml(section.directAnswer)}</strong></p>`
    );
    lines.push(`<div>${section.body}</div>`);
    lines.push(`<p><em>${escapeHtml(section.keyPoint)}</em></p>`);
    lines.push(`</section>`);
  }

  lines.push(`<section>`);
  lines.push(`<h2>마무리</h2>`);
  lines.push(`<p>${escapeHtml(article.outro)}</p>`);
  lines.push(`</section>`);

  if (article.faq.length > 0) {
    lines.push(`<section>`);
    lines.push(`<h2>자주 묻는 질문</h2>`);
    for (const item of article.faq) {
      lines.push(`<div>`);
      lines.push(`<p><strong>Q: ${escapeHtml(item.question)}</strong></p>`);
      lines.push(`<p>A: ${escapeHtml(item.answer)}</p>`);
      lines.push(`</div>`);
    }
    lines.push(`</section>`);
  }

  lines.push("</body>");
  lines.push("</html>");

  return lines.join("\n");
}

export function exportSEO(seo: SEO): string {
  const lines: string[] = [];

  lines.push("=== SEO 정보 ===");
  lines.push("");
  lines.push(`메타 타이틀: ${seo.metaTitle}`);
  lines.push(`메타 설명: ${seo.metaDesc}`);
  lines.push("");
  lines.push(`주요 키워드: ${seo.primaryKeyword}`);
  lines.push(`보조 키워드: ${seo.secondaryKeywords.join(", ")}`);
  lines.push("");
  lines.push("GEO 최적화 팁:");
  for (const tip of seo.geoTips) {
    lines.push(`  - ${tip}`);
  }

  return lines.join("\n");
}

export async function copyToClipboard(
  text: string,
  html?: string
): Promise<void> {
  if (html && navigator.clipboard && window.ClipboardItem) {
    try {
      const items: Record<string, Blob> = {
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      };
      await navigator.clipboard.write([new ClipboardItem(items)]);
      return;
    } catch {
      // fall through to text-only copy
    }
  }
  await navigator.clipboard.writeText(text);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
