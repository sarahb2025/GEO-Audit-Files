import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/extract-keywords?url=example.com
 * Scrapes a website and extracts keywords from meta tags, headings, and content.
 */
export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 });
  }

  // Normalize URL
  let url = rawUrl.trim();
  if (!url.startsWith("http")) url = `https://${url}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GEOAuditBot/1.0; +https://aieconomy.ai)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch website (${res.status})` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const keywords = extractKeywords(html);

    return NextResponse.json({ keywords });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch website";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function extractKeywords(html: string): string[] {
  const results = new Set<string>();

  // Meta title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    extractPhrases(titleMatch[1]).forEach((p) => results.add(p));
  }

  // Meta description
  const descMatch = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
  );
  if (descMatch) {
    extractPhrases(descMatch[1]).forEach((p) => results.add(p));
  }

  // Meta keywords tag
  const metaKwMatch = html.match(
    /<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i
  );
  if (metaKwMatch) {
    metaKwMatch[1].split(",").forEach((kw) => {
      const trimmed = kw.trim().toLowerCase();
      if (trimmed.length > 2 && trimmed.length < 60) {
        results.add(trimmed);
      }
    });
  }

  // H1 tags
  const h1Matches = html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi);
  for (const match of h1Matches) {
    extractPhrases(match[1]).forEach((p) => results.add(p));
  }

  // H2 tags
  const h2Matches = html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi);
  for (const match of h2Matches) {
    extractPhrases(match[1]).forEach((p) => results.add(p));
  }

  // OG title
  const ogTitle = html.match(
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
  );
  if (ogTitle) {
    extractPhrases(ogTitle[1]).forEach((p) => results.add(p));
  }

  // OG description
  const ogDesc = html.match(
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
  );
  if (ogDesc) {
    extractPhrases(ogDesc[1]).forEach((p) => results.add(p));
  }

  // Filter out too-short or generic terms
  const stopwords = new Set([
    "home", "about", "contact", "services", "the", "and", "for", "our",
    "your", "with", "that", "this", "from", "are", "was", "were", "has",
    "have", "been", "will", "can", "more", "all", "new", "get", "how",
    "what", "who", "why", "where", "when", "page", "website", "site",
  ]);

  return Array.from(results)
    .filter((kw) => kw.length > 3 && !stopwords.has(kw))
    .slice(0, 20);
}

function extractPhrases(text: string): string[] {
  // Clean HTML entities and extra whitespace
  const clean = text
    .replace(/&[a-z]+;/gi, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean || clean.length < 3) return [];

  const phrases: string[] = [];

  // Split by common delimiters
  const parts = clean.split(/[|–—\-:,•·]/);
  for (const part of parts) {
    const trimmed = part.trim().toLowerCase();
    if (trimmed.length > 3 && trimmed.length < 60) {
      phrases.push(trimmed);
    }
  }

  return phrases;
}
