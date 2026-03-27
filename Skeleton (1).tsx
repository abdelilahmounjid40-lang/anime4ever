import React from 'react';

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1a1a1a] rounded-lg ${className}`}></div>;
}

export function AnimeCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-[16/9] w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function EpisodeCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-lg bg-[#1a1a1a] border border-white/5">
      <Skeleton className="w-32 h-20 flex-shrink-0" />
      <div className="flex flex-col justify-center gap-2 w-full">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}
