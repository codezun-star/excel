import { ARTICLES } from "@/content/blog";
import { articleUrl } from "@/lib/blog-seo";
import { absoluteUrl, SITE } from "@/lib/site";

export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Feed RSS del blog (lo leen agregadores y ayuda al rastreo de artículos nuevos). */
export function GET() {
  const items = ARTICLES.map(
    (a) => `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${articleUrl(a)}</link>
      <guid isPermaLink="true">${articleUrl(a)}</guid>
      <description>${escapeXml(a.description)}</description>
      <pubDate>${new Date(`${a.publishedAt}T12:00:00Z`).toUTCString()}</pubDate>
    </item>`,
  ).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`Blog de ${SITE.name}`)}</title>
    <link>${absoluteUrl("/blog")}</link>
    <atom:link href="${absoluteUrl("/blog/rss.xml")}" rel="self" type="application/rss+xml" />
    <description>Guías de planilla, impuestos, facturación y Excel para Honduras.</description>
    <language>es-HN</language>
${items}
  </channel>
</rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
