"use client";

import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { motion } from "framer-motion";
import { Wallet, MousePointerClick, Sparkles, Link as LinkIcon, Loader2, Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { getAvailableCampaigns, getPromoterStats, generateShareLink } from "@/app/actions/campaign";
import { useToast } from "@/components/ui/toast";
import type { Campaign } from "@/types";

interface PromoterStats {
    earnings: number;
    totalClicks: number;
    conversions: number;
}

export default function PromoterDashboard() {
    const t = useTranslations('Dashboard');
    const locale = useLocale();
    const { toast } = useToast();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<PromoterStats>({ earnings: 0, totalClicks: 0, conversions: 0 });
    const [generatingLink, setGeneratingLink] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [campaignData, statsData] = await Promise.all([
                    getAvailableCampaigns(),
                    getPromoterStats(),
                ]);
                setCampaigns((campaignData as Campaign[]) || []);
                setStats(statsData as PromoterStats);
            } catch (err) {
                console.error("Failed to load promoter data", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleGetLink = async (campaignId: string) => {
        setGeneratingLink(campaignId);
        try {
            const result = await generateShareLink(campaignId);
            if (result.success && result.code) {
                const link = `${window.location.origin}/r/${result.code}`;
                await navigator.clipboard.writeText(link);
                setCopiedLink(campaignId);
                toast({ title: t('toastCopied'), description: link, variant: 'success' });
                setTimeout(() => setCopiedLink(null), 3000);
            } else {
                toast({ title: t('toastError'), description: result.error || 'Failed to generate link', variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setGeneratingLink(null);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">{t('promoter')}</h1>
                <p className="text-muted-foreground mt-1">{t('promoterSubtitle')}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <motion.div variants={item}>
                    <StatsCard
                        title={t('myEarnings')}
                        value={loading ? '...' : `₪ ${stats.earnings.toLocaleString()}`}
                        icon={<Wallet className="h-5 w-5" />}
                        accentColor="green"
                    />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard
                        title={t('totalClicks')}
                        value={loading ? '...' : stats.totalClicks}
                        icon={<MousePointerClick className="h-5 w-5" />}
                        trend={{ value: 0, label: t('thisWeek') }}
                        accentColor="blue"
                    />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard
                        title={t('conversions')}
                        value={loading ? '...' : stats.conversions}
                        icon={<Sparkles className="h-5 w-5" />}
                        accentColor="purple"
                    />
                </motion.div>
            </div>

            <motion.div variants={item}>
                <h2 className="text-xl font-semibold mb-4 text-foreground">{t('availableCampaigns')}</h2>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="text-center py-12 glass rounded-xl border border-dashed border-white/10">
                        <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">{t('noCampaignsFound')}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.map((campaign) => (
                            <div key={campaign.id} className="glass rounded-xl p-6 hover:translate-y-[-4px] transition-all duration-300 gradient-border">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">{campaign.name}</h3>
                                        {campaign.provider && (
                                            <span className="text-xs text-muted-foreground">{t('by')} {campaign.provider.name}</span>
                                        )}
                                    </div>
                                    <Badge variant="success">{campaign.commission}% {t('commission')}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-6">
                                    {campaign.description}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        className="w-full bg-primary hover:bg-primary/90"
                                        size="sm"
                                        onClick={() => handleGetLink(campaign.id)}
                                        disabled={generatingLink === campaign.id}
                                    >
                                        {generatingLink === campaign.id ? (
                                            <Loader2 className="me-2 h-3 w-3 animate-spin" />
                                        ) : copiedLink === campaign.id ? (
                                            <Check className="me-2 h-3 w-3" />
                                        ) : (
                                            <LinkIcon className="me-2 h-3 w-3" />
                                        )}
                                        {copiedLink === campaign.id ? t('toastCopied') : t('getLink')}
                                    </Button>
                                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5" size="sm">
                                        <Sparkles className="me-2 h-3 w-3 text-purple-400" /> {t('aiText')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
