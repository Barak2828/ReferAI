import { SkeletonStats, SkeletonTable } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-48 animate-shimmer rounded-md" />
                    <div className="h-4 w-64 animate-shimmer rounded-md mt-2" />
                </div>
            </div>
            <SkeletonStats />
            <SkeletonTable />
        </div>
    );
}
