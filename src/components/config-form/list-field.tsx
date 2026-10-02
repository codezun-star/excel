"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Lista editable de textos (categorías, columnas, formas de pago…). */
export function ListField({
  id,
  value,
  onChange,
  placeholder,
  maxItems = 30,
  addLabel = "Agregar",
  disabled,
}: {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  addLabel?: string;
  disabled?: boolean;
}) {
  const items = Array.isArray(value) ? value : [];
  const set = (i: number, v: string) => onChange(items.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="cell-label h-9 w-8 shrink-0 rounded-md">{i + 1}</span>
            <Input
              id={i === 0 ? id : undefined}
              aria-label={`Elemento ${i + 1}`}
              value={item}
              placeholder={placeholder}
              onChange={(e) => set(i, e.target.value)}
              disabled={disabled}
              className="h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Subir"
              onClick={() => move(i, -1)}
              disabled={disabled || i === 0}
            >
              <ArrowUpIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Bajar"
              onClick={() => move(i, 1)}
              disabled={disabled || i === items.length - 1}
            >
              <ArrowDownIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Quitar"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              disabled={disabled}
            >
              <XIcon />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, ""])}
        disabled={disabled || items.length >= maxItems}
      >
        <PlusIcon />
        {addLabel}
      </Button>
    </div>
  );
}
