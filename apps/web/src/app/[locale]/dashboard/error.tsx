"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { AlertCircle } from "lucide-react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations('Dashboard');

    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="glass rounded-xl p-8 max-w-md">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">{t('errorTitle')}</h2>
                <p className="text-muted-foreground text-sm mb-6">
                    {error.message || t('errorDescription')}
                </p>
                <Button onClick={reset} className="bg-primary hover:bg-primary/90">
                    {t('errorRetry')}
                </Button>
            </div>
        </div>
    );
}
