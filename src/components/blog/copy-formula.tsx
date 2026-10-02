"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

export function CopyFormula({ formula }: { formula: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-2 rounded-xl border bg-[#1e2a23] p-3 text-[#e8f3ec]">
      <span className="mt-0.5 rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs italic">fx</span>
      <code className="min-w-0 flex-1 overflow-x-auto font-mono text-sm leading-relaxed whitespace-pre">
        {formula}
      </code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(formula).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="rounded-md p-1.5 hover:bg-white/10"
        aria-label={copied ? "Fórmula copiada" : "Copiar fórmula"}
      >
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      </button>
    </div>
  );
}
