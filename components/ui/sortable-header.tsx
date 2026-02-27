"use client";

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  active,
  direction,
  onClick,
  className = "",
}: SortableHeaderProps) {
  return (
    <button
      onClick={() => onClick(sortKey)}
      className={`flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors select-none ${className}`}
    >
      {label}
      {active ? (
        direction === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}
