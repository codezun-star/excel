"use client";

import { CheckIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ColorField({
  id,
  value,
  onChange,
  presets = [],
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  presets?: string[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          aria-label={`Usar color ${p}`}
          aria-pressed={value.toLowerCase() === p.toLowerCase()}
          disabled={disabled}
          onClick={() => onChange(p)}
          className={cn(
            "flex size-8 items-center justify-center rounded-md border-2 border-transparent",
            value.toLowerCase() === p.toLowerCase() && "border-foreground",
          )}
          style={{ backgroundColor: p }}
        >
          {value.toLowerCase() === p.toLowerCase() && <CheckIcon className="size-4 text-white" />}
        </button>
      ))}
      <input
        type="color"
        aria-label="Elegir otro color"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#217346"}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-8 w-10 cursor-pointer rounded-md border bg-transparent p-0.5"
      />
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-8 w-28 font-mono text-xs"
        maxLength={7}
      />
    </div>
  );
}
