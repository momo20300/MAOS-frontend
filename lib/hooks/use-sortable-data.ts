"use client";

import { useState, useMemo } from "react";

type SortDirection = "asc" | "desc";

export function useSortableData<T extends Record<string, any>>(  // eslint-disable-line @typescript-eslint/no-explicit-any
  data: T[],
  defaultKey?: string,
  defaultDir: SortDirection = "desc"
) {
  const [sortKey, setSortKey] = useState<string>(defaultKey || "");
  const [sortDir, setSortDir] = useState<SortDirection>(defaultDir);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp = 0;

      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else if (typeof aVal === "string" && typeof bVal === "string") {
        // Check if date string (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}/.test(aVal) && /^\d{4}-\d{2}-\d{2}/.test(bVal)) {
          cmp = aVal.localeCompare(bVal);
        } else {
          cmp = aVal.localeCompare(bVal, "fr", { sensitivity: "base" });
        }
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  return { sortedData, sortKey, sortDir, toggleSort };
}
