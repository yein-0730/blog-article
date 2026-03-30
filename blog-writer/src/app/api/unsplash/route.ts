import { NextRequest } from "next/server";

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  const page = request.nextUrl.searchParams.get("page") || "1";

  if (!query) {
    return Response.json({ error: "query 파라미터가 필요합니다." }, { status: 400 });
  }

  if (!UNSPLASH_ACCESS_KEY) {
    return Response.json({ error: "Unsplash API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=4&page=${page}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Unsplash API 오류: ${res.status}`);
    }

    const data = await res.json();

    const images = data.results.map((img: Record<string, unknown>) => {
      const urls = img.urls as Record<string, string>;
      const user = img.user as Record<string, unknown>;
      const links = img.links as Record<string, string>;
      const userLinks = user.links as Record<string, string>;

      return {
        id: img.id,
        url: urls.regular,
        thumb: urls.small,
        alt: img.alt_description || img.description || query,
        photographer: user.name,
        photographerUrl: userLinks.html,
        downloadUrl: links.download_location,
        unsplashUrl: links.html,
      };
    });

    return Response.json({ images });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "이미지 검색 오류";
    console.error("Unsplash API error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
