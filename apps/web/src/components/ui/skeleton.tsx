import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={cn("animate-shimmer rounded-md", className)} />
    );
}

export function SkeletonCard() {
    return (
        <div className="glass rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
        </div>
    );
}

export function SkeletonStats() {
    return (
        <div className="grid gap-6 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
    );
}

export function SkeletonTable() {
    return (
        <div className="glass rounded-lg overflow-hidden">
            <div className="p-4 border-b border-white/5">
                <Skeleton className="h-4 w-48" />
            </div>
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border-b border-white/5 flex gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-24" />
                </div>
            ))}
        </div>
    );
}
