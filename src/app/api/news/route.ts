import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { NewsItem } from "@/lib/types";

const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/rss.xml", source: "BBC" },
  { url: "https://feeds.npr.org/1001/rss.xml", source: "NPR" },
  { url: "https://www.theguardian.com/world/rss", source: "Guardian" },
];

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function parseRSS(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";

    if (title && link) {
      items.push({
        title: decodeEntities(title).trim(),
        link: decodeEntities(link).trim(),
        source,
        pubDate,
      });
    }
  }

  return items;
}

async function fetchFeed(
  url: string,
  source: string
): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, source);
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  const results = await Promise.all(
    RSS_FEEDS.map((feed) => fetchFeed(feed.url, feed.source))
  );

  const all = results.flat();

  // Deduplicate by normalized title
  const seen = new Set<string>();
  const unique = all.filter((item) => {
    const key = item.title.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date descending
  unique.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  return NextResponse.json(unique);
}
