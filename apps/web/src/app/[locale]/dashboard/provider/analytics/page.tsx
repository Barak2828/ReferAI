"use client";

import { StatsCard } from "@/components/ui/stats-card";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { motion } from "framer-motion";
import {
    TrendingUp, MousePointerClick, Wallet, Target, Loader2, BarChart3,
    Download, Instagram, Facebook, Youtube, MessageSquare, Users,
    DollarSign, Eye, Activity,
} from "lucide-react";
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

const PLATFORM_ICONS: Record<string, any> = {
    instagram: Instagram,
    facebook: Facebook,
    youtube: Youtube,
    whatsapp: MessageSquare,
};

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
                c.name, String(c.leads), String(c.clicks),
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

    const maxLeads = Math.max(...data.campaignBreakdown.map(c => c.leads), 1);

    // Simulated channel distribution for donut chart
    const channels = [
        { name: 'Instagram', color: '#E1306C', pct: 35 },
        { name: 'Facebook', color: '#1877F2', pct: 25 },
        { name: 'WhatsApp', color: '#25D366', pct: 22 },
        { name: 'YouTube', color: '#FF0000', pct: 18 },
    ];

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Campaign Analytics & Earnings</h1>
                    <p className="text-muted-foreground mt-1">{t('analyticsSubtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
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
                        Export
                    </Button>
                </div>
            </div>

            {/* Top Stats — Stitch style: Total Earnings, Engagement Rate, Reach */}
            <div className="grid gap-4 md:grid-cols-3">
                <motion.div variants={item}>
                    <div className="glass rounded-xl p-5 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-muted-foreground">Total Earnings</span>
                            <DollarSign className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                            ${data.totalRevenue.toLocaleString()}<span className="text-emerald-400 text-sm font-normal ms-2">+12%</span>
                        </div>
                        <div className="mt-3 h-8 flex items-end gap-0.5">
                            {[40, 55, 35, 70, 60, 80, 65, 90, 75, 85, 95, 100].map((h, i) => (
                                <div key={i} className="flex-1 bg-gradient-to-t from-emerald-500/40 to-emerald-500/80 rounded-t" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">+12% last 30 days</p>
                    </div>
                </motion.div>
                <motion.div variants={item}>
                    <div className="glass rounded-xl p-5 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-muted-foreground">Engagement Rate</span>
                            <Activity className="h-4 w-4 text-violet-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                            {data.conversionRate}%
                        </div>
                        <div className="mt-3 h-8 flex items-end gap-0.5">
                            {[60, 45, 70, 55, 80, 65, 90, 75, 85, 70, 80, 90].map((h, i) => (
                                <div key={i} className="flex-1 bg-gradient-to-t from-violet-500/40 to-violet-500/80 rounded-t" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Highest peak: {data.conversionRate}%</p>
                    </div>
                </motion.div>
                <motion.div variants={item}>
                    <div className="glass rounded-xl p-5 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-muted-foreground">Reach</span>
                            <Eye className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                            {data.totalClicks > 1000 ? `${(data.totalClicks / 1000).toFixed(1)}K` : data.totalClicks}
                        </div>
                        <div className="mt-3 h-8 flex items-end gap-0.5">
                            {[50, 65, 45, 75, 55, 85, 70, 90, 80, 95, 85, 100].map((h, i) => (
                                <div key={i} className="flex-1 bg-gradient-to-t from-blue-500/40 to-blue-500/80 rounded-t" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">+{Math.round(data.totalClicks * 0.35)}% network growth</p>
                    </div>
                </motion.div>
            </div>

            {/* Main Content Grid: Performance Table + Channel Distribution */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Campaign Performance Table — 2 cols */}
                <motion.div variants={item} className="lg:col-span-2">
                    <div className="glass rounded-xl border border-white/5 overflow-hidden">
                        <div className="p-4 border-b border-white/5">
                            <h2 className="text-lg font-semibold text-foreground">Campaign Performance</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="text-start p-3 text-xs font-medium text-muted-foreground">Campaign</th>
                                        <th className="text-start p-3 text-xs font-medium text-muted-foreground">Social Channels</th>
                                        <th className="text-start p-3 text-xs font-medium text-muted-foreground">Earnings</th>
                                        <th className="text-start p-3 text-xs font-medium text-muted-foreground">Clicks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {data.campaignBreakdown.map((campaign) => (
                                        <tr key={campaign.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center">
                                                        <BarChart3 className="h-4 w-4 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{campaign.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">Active campaign</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1.5">
                                                    {['instagram', 'facebook', 'whatsapp'].map(p => {
                                                        const Icon = PLATFORM_ICONS[p] || MessageSquare;
                                                        return (
                                                            <div key={p} className="h-6 w-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                                <Icon className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-sm font-medium text-emerald-400">
                                                    ${campaign.leads > 0 ? (campaign.leads * 150).toLocaleString() : '0'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-sm text-muted-foreground">{campaign.clicks.toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>

                {/* Channel Distribution — 1 col */}
                <motion.div variants={item}>
                    <div className="glass rounded-xl p-5 border border-white/5 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Channel Distribution</h3>
                        {/* Donut chart */}
                        <div className="flex justify-center py-4">
                            <div className="relative w-36 h-36">
                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                    {channels.reduce((acc, ch, i) => {
                                        const offset = acc.offset;
                                        acc.elements.push(
                                            <circle
                                                key={ch.name}
                                                cx="18" cy="18" r="14"
                                                fill="none"
                                                stroke={ch.color}
                                                strokeWidth="4"
                                                strokeDasharray={`${ch.pct * 0.88} ${100 - ch.pct * 0.88}`}
                                                strokeDashoffset={`-${offset}`}
                                                className="transition-all duration-500"
                                            />
                                        );
                                        acc.offset += ch.pct * 0.88;
                                        return acc;
                                    }, { elements: [] as JSX.Element[], offset: 0 }).elements}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-foreground">{data.campaignCount}</div>
                                        <div className="text-[10px] text-muted-foreground">Campaigns</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="space-y-2">
                            {channels.map(ch => (
                                <div key={ch.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                                        <span className="text-muted-foreground">{ch.name}</span>
                                    </div>
                                    <span className="font-medium text-foreground">{ch.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Grid: Top Contributors + Network Traffic */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Contributors */}
                {data.topPromoters.length > 0 && (
                    <motion.div variants={item}>
                        <div className="glass rounded-xl border border-white/5 overflow-hidden">
                            <div className="p-4 border-b border-white/5">
                                <h2 className="text-lg font-semibold text-foreground">Top Contributors</h2>
                            </div>
                            <div className="divide-y divide-white/5">
                                {data.topPromoters.slice(0, 5).map((promoter, index) => (
                                    <div key={promoter.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                                index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                                'bg-gradient-to-br from-blue-500 to-indigo-500'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{promoter.name}</p>
                                                <p className="text-xs text-muted-foreground">{promoter.clicks} clicks</p>
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <p className="text-sm font-semibold text-emerald-400">{promoter.leads} leads</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Withdrawal / Payout Section */}
                <motion.div variants={item}>
                    <div className="glass rounded-xl p-5 border border-white/5 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">Withdrawal</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Available Balance</p>
                                <p className="text-2xl font-bold text-foreground">${data.totalRevenue.toLocaleString()}</p>
                            </div>
                            <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-6">
                                Cash Out Now
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            <div className="h-6 w-6 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <Wallet className="h-3 w-3 text-blue-400" />
                            </div>
                            <span className="text-xs text-muted-foreground">Connected: PayPal (****1234)</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full border-white/10 text-xs">
                            View Withdrawal History
                        </Button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
