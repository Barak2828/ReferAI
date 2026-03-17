"use client";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { RionaStatusBadge } from "./riona-status-badge";
import { Send, Loader2, Check, X } from "lucide-react";
import type { PostStatus } from "@/lib/riona/types";

interface SocialPostButtonProps {
    label: string;
    status?: PostStatus;
    rionaConnected: boolean;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}

const statusConfig: Record<PostStatus, { icon: React.ReactNode; text: string; color: string }> = {
    PENDING: { icon: <Send className="h-4 w-4" />, text: "Send", color: "" },
    POSTING: { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: "Sending...", color: "text-amber-400" },
    POSTED: { icon: <Check className="h-4 w-4" />, text: "Sent", color: "text-emerald-400" },
    FAILED: { icon: <X className="h-4 w-4" />, text: "Failed", color: "text-red-400" },
};

export function SocialPostButton({
    label,
    status = "PENDING",
    rionaConnected,
    onClick,
    disabled,
    className,
}: SocialPostButtonProps) {
    const config = statusConfig[status];
    const isDisabled = disabled || status === "POSTING" || status === "POSTED" || !rionaConnected;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Button
                variant={status === "POSTED" ? "outline" : "default"}
                size="sm"
                onClick={onClick}
                disabled={isDisabled}
                className={cn(
                    "gap-2",
                    status === "POSTED" && "border-emerald-500/30 text-emerald-400",
                    status === "FAILED" && "border-red-500/30 text-red-400",
                )}
            >
                <span className={config.color}>{config.icon}</span>
                {label} — {config.text}
            </Button>
            {!rionaConnected && (
                <RionaStatusBadge connected={false} />
            )}
        </div>
    );
}
