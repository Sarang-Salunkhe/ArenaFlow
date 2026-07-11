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
