"use client";

import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

interface RionaStatusBadgeProps {
    connected: boolean;
    label?: string;
    className?: string;
}

export function RionaStatusBadge({ connected, label, className }: RionaStatusBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                connected
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/20 bg-red-500/10 text-red-400",
                className
            )}
        >
            {connected ? (
                <Wifi className="h-3 w-3" />
            ) : (
                <WifiOff className="h-3 w-3" />
            )}
            {label || (connected ? "Riona Connected" : "Riona Offline")}
        </span>
    );
}
