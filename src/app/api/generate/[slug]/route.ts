import { NextResponse } from "next/server";

import { XLSX_MIME } from "@/lib/excel/download";
import { workbookFileName } from "@/lib/excel/filename";
import { buildWorkbook, prepareGeneration } from "@/lib/generation";

export const runtime = "nodejs";

/** Genera el .xlsx en el servidor y lo devuelve como descarga. */
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
  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${workbookFileName(slug, prepared.ctx)}"`,
      "Cache-Control": "no-store",
    },
  });
}
