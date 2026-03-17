"use client";

import { StatsCard } from "@/components/ui/stats-card";
import { useTranslations } from 'next-intl';
import { motion } from "framer-motion";
import { TrendingUp, MousePointerClick, Wallet, Target, Sparkles, Loader2, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { getProviderAnalytics } from "@/app/actions/analytics";
import { Badge } from "@/components/ui/badge";

interface Analytics {
    totalLeads: number;
    totalClicks: number;
    totalRevenue: number;
    conversionRate: number;
    campaignCount: number;
    topPromoters: { id: string; name: string; leads: number; clicks: number }[];
    campaignBreakdown: { id: string; name: string; leads: number; clicks: number }[];
}

export default function AnalyticsPage() {
    const t = useTranslations('Dashboard');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Analytics | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const result = await getProviderAnalytics();
                setData(result as Analytics);
            } catch (err) {
                console.error('Failed to load analytics:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!data || (data.totalLeads === 0 && data.totalClicks === 0 && data.campaignCount === 0)) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('analyticsTitle')}</h1>
                    <p className="text-muted-foreground mt-1">{t('analyticsSubtitle')}</p>
                </div>
                <div className="text-center py-16 glass rounded-xl border border-dashed border-white/10">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('noAnalyticsData')}</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">{t('analyticsTitle')}</h1>
                <p className="text-muted-foreground mt-1">{t('analyticsSubtitle')}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <motion.div variants={item}>
                    <StatsCard
                        title={t('totalLeads')}
                        value={data.totalLeads}
                        icon={<TrendingUp className="h-5 w-5" />}
                        accentColor="blue"
                    />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard
                        title={t('totalClicks')}
                        value={data.totalClicks}
                        icon={<MousePointerClick className="h-5 w-5" />}
                        accentColor="purple"
                    />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard
                        title={t('totalRevenue')}
                        value={`₪ ${data.totalRevenue.toLocaleString()}`}
                        icon={<Wallet className="h-5 w-5" />}
                        accentColor="green"
                    />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard
                        title={t('conversionRate')}
                        value={`${data.conversionRate}%`}
                        icon={<Target className="h-5 w-5" />}
                        accentColor="indigo"
                    />
                </motion.div>
            </div>

            {/* Campaign Breakdown */}
            {data.campaignBreakdown.length > 0 && (
                <motion.div variants={item}>
                    <h2 className="text-xl font-semibold mb-4 text-foreground">{t('activeCampaigns')}</h2>
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="border-b border-white/5 bg-white/[0.02] p-4 grid grid-cols-4 font-medium text-sm text-muted-foreground">
                            <div>{t('campaignName')}</div>
                            <div>{t('leads')}</div>
                            <div>{t('clicksGenerated')}</div>
                            <div>{t('conversionRate')}</div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {data.campaignBreakdown.map((campaign) => {
                                const rate = campaign.clicks > 0 ? Math.round((campaign.leads / campaign.clicks) * 100) : 0;
                                return (
                                    <div key={campaign.id} className="p-4 grid grid-cols-4 items-center text-sm hover:bg-white/[0.02] transition-colors">
                                        <div className="font-medium text-foreground">{campaign.name}</div>
                                        <div className="text-muted-foreground">{campaign.leads}</div>
                                        <div className="text-muted-foreground">{campaign.clicks}</div>
                                        <div>
                                            <Badge variant={rate > 5 ? "success" : "default"}>{rate}%</Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Top Promoters */}
            {data.topPromoters.length > 0 && (
                <motion.div variants={item}>
                    <h2 className="text-xl font-semibold mb-4 text-foreground">{t('topPromoters')}</h2>
                    <div className="glass rounded-xl overflow-hidden">
                        <div className="border-b border-white/5 bg-white/[0.02] p-4 grid grid-cols-3 font-medium text-sm text-muted-foreground">
                            <div>{t('promoterName')}</div>
                            <div>{t('leadsGenerated')}</div>
                            <div>{t('clicksGenerated')}</div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {data.topPromoters.map((promoter, index) => (
                                <div key={promoter.id} className="p-4 grid grid-cols-3 items-center text-sm hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-foreground">{promoter.name}</span>
                                    </div>
                                    <div className="text-muted-foreground">{promoter.leads}</div>
                                    <div className="text-muted-foreground">{promoter.clicks}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
