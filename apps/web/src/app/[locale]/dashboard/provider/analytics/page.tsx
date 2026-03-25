"use client";

import { StatsCard } from "@/components/ui/stats-card";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { motion } from "framer-motion";
import { TrendingUp, MousePointerClick, Wallet, Target, Loader2, BarChart3, Calendar, Download } from "lucide-react";
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

type DateRange = '7d' | '30d' | '90d' | 'all';

export default function AnalyticsPage() {
    const t = useTranslations('Dashboard');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Analytics | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>('30d');

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
    }, [dateRange]);

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    function exportCSV() {
        if (!data) return;
        const rows = [
            ['Campaign', 'Leads', 'Clicks', 'Conversion Rate'],
            ...data.campaignBreakdown.map(c => [
                c.name,
                String(c.leads),
                String(c.clicks),
                c.clicks > 0 ? `${Math.round((c.leads / c.clicks) * 100)}%` : '0%',
            ]),
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `referai-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

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

    // Simple bar chart data for campaigns
    const maxLeads = Math.max(...data.campaignBreakdown.map(c => c.leads), 1);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('analyticsTitle')}</h1>
                    <p className="text-muted-foreground mt-1">{t('analyticsSubtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Date range filter */}
                    <div className="flex gap-1 glass rounded-lg p-1">
                        {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    dateRange === range
                                        ? 'bg-primary text-white'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                            >
                                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={exportCSV} className="border-white/10 gap-2">
                        <Download className="h-3.5 w-3.5" />
                        Export CSV
                    </Button>
                </div>
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

            {/* Visual Bar Chart - Campaign Performance */}
            {data.campaignBreakdown.length > 0 && (
                <motion.div variants={item}>
                    <h2 className="text-xl font-semibold mb-4 text-foreground">{t('campaignPerformance') || 'Campaign Performance'}</h2>
                    <div className="glass rounded-xl p-6 space-y-4">
                        {data.campaignBreakdown.map((campaign) => {
                            const rate = campaign.clicks > 0 ? Math.round((campaign.leads / campaign.clicks) * 100) : 0;
                            const barWidth = Math.max((campaign.leads / maxLeads) * 100, 2);
                            return (
                                <div key={campaign.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-foreground truncate max-w-[200px]">{campaign.name}</span>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>{campaign.leads} leads</span>
                                            <span>{campaign.clicks} clicks</span>
                                            <Badge variant={rate > 5 ? "success" : "default"} className="text-[10px]">{rate}%</Badge>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${barWidth}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Campaign Breakdown Table */}
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
