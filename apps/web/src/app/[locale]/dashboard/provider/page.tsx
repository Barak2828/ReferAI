"use client";

import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Users, Wallet, ArrowRight, RefreshCw, Loader2, Sparkles, BarChart3, MousePointerClick, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { syncAzugaCampaigns } from "@/app/actions/azuga";
import { getProviderCampaigns, getProviderStats } from "@/app/actions/campaign";
import { useToast } from "@/components/ui/toast";

interface ProviderCampaign {
    id: string;
    name: string;
    description: string;
    commission: number;
    isActive: boolean;
    createdAt: string;
    leadCount: number;
}

interface ProviderStats {
    totalLeads: number;
    activePromoters: number;
    pendingCommissions: number;
}

export default function ProviderDashboard() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<ProviderCampaign[]>([]);
    const [stats, setStats] = useState<ProviderStats>({ totalLeads: 0, activePromoters: 0, pendingCommissions: 0 });
    const locale = useLocale();
    const t = useTranslations('Dashboard');
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Handle OAuth callback feedback
    useEffect(() => {
        const oauthSuccess = searchParams.get('oauth_success');
        const oauthError = searchParams.get('oauth_error');
        const accountName = searchParams.get('account');

        if (oauthSuccess) {
            toast({
                title: t('socialAccountLinked'),
                description: `${oauthSuccess}${accountName ? ` (@${accountName})` : ''} connected successfully`,
                variant: 'success',
            });
            router.replace(pathname);
        } else if (oauthError) {
            toast({ title: t('toastError'), description: decodeURIComponent(oauthError), variant: 'error' });
            router.replace(pathname);
        }
    }, [searchParams]);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [campaignData, statsData] = await Promise.all([
                    getProviderCampaigns(),
                    getProviderStats(),
                ]);
                setCampaigns((campaignData as ProviderCampaign[]) || []);
                setStats(statsData as ProviderStats);
            } catch (err) {
                console.error('Failed to load provider data:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const result = await syncAzugaCampaigns();
            toast({
                title: t('toastSyncComplete'),
                description: `Synced ${result?.count || 0} campaigns from Azuga CRM`,
                variant: 'success',
            });
            // Reload data after sync
            const [campaignData, statsData] = await Promise.all([
                getProviderCampaigns(),
                getProviderStats(),
            ]);
            setCampaigns((campaignData as ProviderCampaign[]) || []);
            setStats(statsData as ProviderStats);
        } catch (error) {
            toast({ title: t('toastSyncFailed'), description: t('toastSyncFailedDesc'), variant: 'error' });
        } finally {
            setIsSyncing(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('provider')}</h1>
                    <p className="text-muted-foreground mt-1">{t('providerSubtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="border-white/10 hover:bg-white/5"
                    >
                        {isSyncing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}
                        {t('syncFromCRM')}
                    </Button>
                    <Link href={`/${locale}/dashboard/provider/campaigns/new`}>
                        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full px-6 shadow-lg shadow-blue-600/20">
                            <Plus className="me-2 h-4 w-4" /> {t('createCampaign')}
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <motion.div variants={item}>
                    <StatsCard
                        title={t('totalLeads')}
                        value={loading ? '...' : stats.totalLeads}
                        icon={<TrendingUp className="h-5 w-5" />}
                        trend={{ value: 0, label: t('fromLastWeek') }}
                        accentColor="blue"
                    />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard
                        title={t('activePromoters')}
                        value={loading ? '...' : stats.activePromoters}
                        icon={<Users className="h-5 w-5" />}
                        accentColor="purple"
                    />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard
                        title={t('pendingCommissions')}
                        value={loading ? '...' : `₪ ${stats.pendingCommissions.toLocaleString()}`}
                        icon={<Wallet className="h-5 w-5" />}
                        accentColor="indigo"
                    />
                </motion.div>
            </div>

            <motion.div variants={item}>
                <h2 className="text-xl font-semibold mb-4 text-foreground">{t('activeCampaigns')}</h2>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="text-center py-12 glass rounded-xl border border-dashed border-white/10">
                        <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">{t('noCampaignsFound')}</p>
                        <Link href={`/${locale}/dashboard/provider/campaigns/new`}>
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white">
                                <Plus className="me-2 h-4 w-4" /> {t('createCampaign')}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {campaigns.map((campaign) => (
                            <Link
                                key={campaign.id}
                                href={`/${locale}/dashboard/provider/campaigns/${campaign.id}`}
                                className="block"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.005, y: -2 }}
                                    className="glass rounded-xl p-5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-foreground text-lg truncate group-hover:text-primary transition-colors">
                                                    {campaign.name}
                                                </h3>
                                                <Badge variant={campaign.isActive ? "success" : "default"}>
                                                    {campaign.isActive ? t('active') : t('paused')}
                                                </Badge>
                                            </div>
                                            {campaign.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                                                    {campaign.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
                                                    <span>{campaign.leadCount} {t('leads')}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                                                    <span>{campaign.commission}% {t('commissionLabel')}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <FileText className="h-3.5 w-3.5 text-indigo-400" />
                                                    <span>{new Date(campaign.createdAt).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-muted-foreground group-hover:text-primary transition-colors">
                                            <BarChart3 className="h-5 w-5 me-1" />
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
