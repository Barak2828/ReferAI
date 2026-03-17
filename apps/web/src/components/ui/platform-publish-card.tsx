"use client";

import { Button } from "@/components/ui/button";
import { PublishStatusBadge } from "@/components/ui/publish-status-badge";
import { cn } from "@/lib/utils";
import { Copy, Send, Link2, Loader2 } from "lucide-react";
import type { PublishJobStatus, SocialAccount } from "@/lib/riona/types";

interface PlatformPublishCardProps {
    platform: string;
    label: string;
    icon: React.ReactNode;
    iconColor: string;
    borderColor: string;
    contentText: string;
    account?: SocialAccount | null;
    publishStatus: PublishJobStatus | 'IDLE';
    isPublishing: boolean;
    onPublish: () => void;
    onConnect: () => void;
    onCopy: () => void;
    t: (key: string) => string;
}

export function PlatformPublishCard({
    platform,
    label,
    icon,
    iconColor,
    borderColor,
    contentText,
    account,
    publishStatus,
    isPublishing,
    onPublish,
    onConnect,
    onCopy,
    t,
}: PlatformPublishCardProps) {
    const isConnected = !!account;
    const canPublish = isConnected && publishStatus !== 'PROCESSING' && publishStatus !== 'COMPLETED';
    const isCompleted = publishStatus === 'COMPLETED';

    return (
        <div className={cn(
            "glass rounded-xl p-5 border transition-all",
            isConnected ? borderColor : "border-white/5 opacity-75",
        )}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", iconColor)}>
                        {icon}
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground">{label}</h4>
                        {isConnected ? (
                            <p className="text-xs text-emerald-400 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                                {t('connected')}: @{account.username}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground">{t('publishNoAccount')}</p>
                        )}
                    </div>
                </div>
                <PublishStatusBadge status={publishStatus} />
            </div>

            {/* Content preview */}
            <div className="mt-4 p-3 rounded-lg bg-black/20 max-h-24 overflow-y-auto">
                <p className="text-xs text-foreground/70 whitespace-pre-wrap leading-relaxed line-clamp-4">
                    {contentText}
                </p>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
                {isConnected ? (
                    <Button
                        className={cn(
                            "flex-1",
                            isCompleted
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20",
                        )}
                        onClick={onPublish}
                        disabled={!canPublish || isPublishing}
                        size="sm"
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" />
                                {t('publishPublishing')}
                            </>
                        ) : isCompleted ? (
                            <>
                                <span className="me-2">&#10003;</span>
                                {t('publishSuccess')}
                            </>
                        ) : (
                            <>
                                <Send className="me-2 h-3.5 w-3.5" />
                                {t('publishButton')}
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className="flex-1 border-white/10 hover:bg-white/5"
                        onClick={onConnect}
                        size="sm"
                    >
                        <Link2 className="me-2 h-3.5 w-3.5" />
                        {t('publishConnectFirst')}
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary"
                    onClick={onCopy}
                >
                    <Copy className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
