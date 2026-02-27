"use client";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/50", className)}
      {...props}
    />
  );
}

function SkeletonKPICards({ count = 4 }: { count?: number }) {
  return (
    <div className={cn("grid gap-4", count === 3 ? "md:grid-cols-3" : "md:grid-cols-4")}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

function SkeletonToolbar() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-80 rounded-xl" />
        <Skeleton className="h-8 w-16 rounded-xl" />
        <Skeleton className="h-8 w-16 rounded-xl" />
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-28 rounded-xl" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}

function SkeletonListRows({ count = 6 }: { count?: number }) {
  return (
    <div className="rounded-2xl border">
      <div className="p-4 border-b">
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonCardGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PageSkeleton({
  title,
  kpiCount = 4,
  rowCount = 6,
  layout = "list",
}: {
  title?: string;
  kpiCount?: number;
  rowCount?: number;
  layout?: "list" | "grid";
}) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {title ? (
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          ) : (
            <Skeleton className="h-9 w-48" />
          )}
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <SkeletonKPICards count={kpiCount} />
      <SkeletonToolbar />
      {layout === "list" ? (
        <SkeletonListRows count={rowCount} />
      ) : (
        <SkeletonCardGrid count={rowCount} />
      )}
    </div>
  );
}

function DashboardSkeleton({ title }: { title?: string }) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {title ? (
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      {/* KPI Cards */}
      <SkeletonKPICards count={4} />

      {/* Chart area */}
      <div className="rounded-2xl border p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-[180px] w-full rounded-lg" />
      </div>

      {/* Bottom grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonKPICards,
  SkeletonToolbar,
  SkeletonListRows,
  SkeletonCardGrid,
  PageSkeleton,
  DashboardSkeleton,
};
