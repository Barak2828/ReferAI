import { SkeletonStats, SkeletonTable } from "@/components/ui/skeleton";

export default function ProviderLoading() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-48 animate-shimmer rounded-md" />
                    <div className="h-4 w-64 animate-shimmer rounded-md mt-2" />
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-44 animate-shimmer rounded-md" />
                    <div className="h-10 w-40 animate-shimmer rounded-full" />
                </div>
            </div>
            <SkeletonStats />
            <SkeletonTable />
        </div>
    );
}
