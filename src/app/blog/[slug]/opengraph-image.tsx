import { ARTICLES, getArticle, getBlogCategory } from "@/content/blog";
import { OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Guía de Excel Codezun";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const article = getArticle((await params).slug);
  return renderOgImage({
    title: article?.seoTitle ?? "Guías para Honduras",
    subtitle: article ? (getBlogCategory(article.category)?.name ?? "Guía") : "Blog",
    badge: "Guía",
  });
}
