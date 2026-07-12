interface LoadingSkeletonProps {
  lines?: number;
}

export function LoadingSkeleton({ lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={`${index}-${lines}`}
          className="h-3 animate-pulse rounded-full bg-slate-700/80"
          style={{ width: `${88 - index * 8}%` }}
        />
      ))}
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-xl shadow-slate-950/20 backdrop-blur-md animate-pulse border-l-4 border-l-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Label skeleton */}
          <div className="h-2.5 bg-slate-800 rounded-full w-2/3" />
          {/* Value skeleton */}
          <div className="h-8 bg-slate-700 rounded-lg w-1/2" />
          {/* Helper skeleton */}
          <div className="h-3 bg-slate-800 rounded-full w-5/6" />
        </div>
        {/* Icon container skeleton */}
        <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800/50 border border-slate-700/30" />
      </div>
    </div>
  );
}

export function CopilotSkeleton() {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900/30 p-5 shadow-xl backdrop-blur-md animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/50">
        <div className="space-y-2">
          <div className="h-2 bg-slate-800 rounded-full w-16" />
          <div className="h-4 bg-slate-700 rounded-lg w-36" />
        </div>
        <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
      </div>

      {/* Brief Box Skeleton */}
      <div className="bg-slate-950/60 rounded-2xl p-4 border border-white/5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
          <div className="h-3 bg-slate-800 rounded-full w-24" />
          <div className="h-3 bg-slate-800 rounded-full w-16" />
        </div>
        <div className="space-y-2 pt-1">
          <div className="h-2.5 bg-slate-800/80 rounded-full w-full" />
          <div className="h-2.5 bg-slate-800/80 rounded-full w-5/6" />
          <div className="h-2.5 bg-slate-800/80 rounded-full w-4/5" />
          <div className="h-2.5 bg-slate-800/80 rounded-full w-2/3" />
        </div>
        <div className="h-8 bg-slate-800/70 rounded-xl w-full mt-2" />
      </div>

      {/* Q&A Terminal Skeleton */}
      <div className="flex-1 flex flex-col bg-slate-950/80 rounded-2xl border border-white/5 p-4 space-y-4 min-h-[250px]">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
          <div className="h-4 w-4 bg-slate-800 rounded" />
          <div className="h-3 bg-slate-800 rounded-full w-28" />
        </div>
        <div className="flex-1 space-y-3.5 py-3">
          <div className="h-2.5 bg-slate-800/60 rounded-full w-3/4" />
          <div className="h-2.5 bg-slate-800/60 rounded-full w-2/3" />
          <div className="h-2.5 bg-slate-800/60 rounded-full w-1/2" />
        </div>
        {/* Input box skeleton */}
        <div className="flex gap-2 pt-2 border-t border-slate-800/50">
          <div className="h-8 bg-slate-900 border border-slate-800 rounded-xl flex-1" />
          <div className="h-8 w-10 bg-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
