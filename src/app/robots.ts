import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cuenta", "/admin", "/api/", "/auth/", "/checkout", "/pago/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
