import { NextResponse } from "next/server";

import { workbookToPreview } from "@/lib/excel/preview";
import { buildWorkbook, prepareGeneration } from "@/lib/generation";

export const runtime = "nodejs";

/** Vista previa generada en el servidor (plantillas Pro). */
export async function POST(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const body = await request.json().catch(() => null);
  const prepared = await prepareGeneration(slug, body);
  if (!prepared.ok)
    return NextResponse.json(
      { error: prepared.error, issues: prepared.issues },
      { status: prepared.status },
    );
  const wb = await buildWorkbook(prepared, { watermark: true });
  return NextResponse.json(workbookToPreview(wb));
}
