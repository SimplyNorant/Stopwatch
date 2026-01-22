export default function StopwatchSkeletonList({
  count = 3,
}: {
  count?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <StopwatchSkeleton key={i} />
      ))}
    </div>
  );
}

function StopwatchSkeleton() {
  return (
    <div className="w-80 space-y-3">
      {/* Title */}
      <Skeleton className="h-8 w-3/4 mx-auto" />

      {/* Time display */}
      <Skeleton className="h-16 w-full rounded-lg" />

      {/* Buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-12 w-40 rounded-md" />
        <Skeleton className="h-12 w-40 rounded-md" />
      </div>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-400 dark:bg-gray-600 ${className}`}
      aria-hidden="true"
    />
  );
}
