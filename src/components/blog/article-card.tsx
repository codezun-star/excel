import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { getBlogCategory, readingMinutes, type Article } from "@/content/blog";
import { requireCountryContext } from "@/countries";
import { cn } from "@/lib/utils";

export function ArticleCard({ article, featured }: { article: Article; featured?: boolean }) {
  const category = getBlogCategory(article.category);
  const minutes = readingMinutes(article.body(requireCountryContext("HN")));
  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md",
        featured && "sm:p-7",
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-brand-strong uppercase">
        {category?.name}
      </p>
      <h3
        className={cn(
          "mt-2 font-heading leading-snug font-bold",
          featured ? "text-2xl" : "text-lg",
        )}
      >
        <Link href={`/blog/${article.slug}`} className="after:absolute after:inset-0">
          {article.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
      <p className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-strong">
        Leer guía · {minutes} min
        <ArrowRightIcon
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </p>
    </article>
  );
}
