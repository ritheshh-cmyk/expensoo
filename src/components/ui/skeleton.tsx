import { cn } from "@/lib/utils";

// ── Base shimmer skeleton ─────────────────────────────────────────────────────
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white/5",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/8 before:to-transparent",
        "before:animate-[shimmer_1.6s_infinite]",
        className
      )}
      {...props}
    />
  );
}

// ── Dashboard metric card skeleton ────────────────────────────────────────────
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/6 bg-white/3 p-5 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-2.5 w-20" />
    </div>
  );
}

// ── List row skeleton (transactions, suppliers, recent activity) ───────────────
function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3 border-b border-white/5", className)}>
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-2.5 w-2/5" />
      </div>
      <div className="text-right space-y-2 shrink-0">
        <Skeleton className="h-3 w-16 ml-auto" />
        <Skeleton className="h-2.5 w-12 ml-auto" />
      </div>
    </div>
  );
}

// ── Table row skeleton (audit log) ────────────────────────────────────────────
function SkeletonTableRow({ cols = 5, className }: { cols?: number; className?: string }) {
  return (
    <tr className={cn("border-b border-white/5", className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={cn("h-3", i === 0 ? "w-24" : i === cols - 1 ? "w-16" : "w-full max-w-[120px]")} />
        </td>
      ))}
    </tr>
  );
}

export { Skeleton, SkeletonCard, SkeletonRow, SkeletonTableRow };
