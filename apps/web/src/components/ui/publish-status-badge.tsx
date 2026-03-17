"use client";

import { cn } from "@/lib/utils";
import { Loader2, Check, X, Clock, RotateCcw } from "lucide-react";
import type { PublishJobStatus } from "@/lib/riona/types";

interface PublishStatusBadgeProps {
    status: PublishJobStatus | 'IDLE';
    className?: string;
}

const statusConfig: Record<string, { icon: typeof Check; color: string; bgColor: string; label: string }> = {
    IDLE: { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-white/5', label: 'Ready' },
    QUEUED: { icon: Clock, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', label: 'Queued' },
    PROCESSING: { icon: Loader2, color: 'text-blue-400', bgColor: 'bg-blue-500/10', label: 'Publishing' },
    COMPLETED: { icon: Check, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'Published' },
    FAILED: { icon: X, color: 'text-red-400', bgColor: 'bg-red-500/10', label: 'Failed' },
    RETRYING: { icon: RotateCcw, color: 'text-amber-400', bgColor: 'bg-amber-500/10', label: 'Retrying' },
};

export function PublishStatusBadge({ status, className }: PublishStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.IDLE;
    const Icon = config.icon;
    const isAnimated = status === 'PROCESSING' || status === 'RETRYING';

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            config.bgColor,
            config.color,
            className,
        )}>
            <Icon className={cn("h-3 w-3", isAnimated && "animate-spin")} />
            {config.label}
        </span>
    );
}
