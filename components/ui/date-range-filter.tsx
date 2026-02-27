"use client";

import { Button } from "./button";
import { Input } from "./input";
import { Calendar } from "lucide-react";

interface DateRangeFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const presets: { label: string; from: string; to: string }[] = [
    {
      label: "Ce mois",
      from: fmt(new Date(year, month, 1)),
      to: fmt(new Date(year, month + 1, 0)),
    },
    {
      label: "Mois dernier",
      from: fmt(new Date(year, month - 1, 1)),
      to: fmt(new Date(year, month, 0)),
    },
    {
      label: "Ce trimestre",
      from: fmt(new Date(year, Math.floor(month / 3) * 3, 1)),
      to: fmt(new Date(year, Math.floor(month / 3) * 3 + 3, 0)),
    },
    {
      label: "Cette annee",
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    },
    {
      label: "Tout",
      from: "",
      to: "",
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="h-8 w-[130px] rounded-xl bg-muted/50 border-0 text-xs focus-visible:ring-1"
        placeholder="Debut"
      />
      <span className="text-xs text-muted-foreground">-</span>
      <Input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="h-8 w-[130px] rounded-xl bg-muted/50 border-0 text-xs focus-visible:ring-1"
        placeholder="Fin"
      />
      <div className="flex gap-1 flex-wrap">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant={from === preset.from && to === preset.to ? "default" : "ghost"}
            size="sm"
            onClick={() => onChange(preset.from, preset.to)}
            className="h-7 px-2 text-xs rounded-lg"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
