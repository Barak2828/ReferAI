"use client";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Instagram, Trash2 } from "lucide-react";
import type { SocialAccount } from "@/lib/riona/types";

interface SocialAccountCardProps {
    account: SocialAccount;
    onUnlink?: (accountId: string) => void;
    isUnlinking?: boolean;
    className?: string;
}

const platformIcons: Record<string, React.ReactNode> = {
    INSTAGRAM: <Instagram className="h-5 w-5" />,
    TWITTER: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    ),
};

const platformColors: Record<string, string> = {
    INSTAGRAM: "text-pink-400",
    TWITTER: "text-sky-400",
};

export function SocialAccountCard({ account, onUnlink, isUnlinking, className }: SocialAccountCardProps) {
    return (
        <div className={cn("glass rounded-lg p-4 flex items-center justify-between", className)}>
            <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center glass", platformColors[account.platform])}>
                    {platformIcons[account.platform]}
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">@{account.username}</p>
                    <p className="text-xs text-muted-foreground">
                        {account.platform.charAt(0) + account.platform.slice(1).toLowerCase()}
                        {account.isActive && (
                            <span className="ms-2 inline-flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                Active
                            </span>
                        )}
                    </p>
                </div>
            </div>
            {onUnlink && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-400"
                    onClick={() => onUnlink(account.id)}
                    disabled={isUnlinking}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
