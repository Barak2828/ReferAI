"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from 'next-intl';
import { motion } from "framer-motion";
import { Wallet, MousePointerClick, TrendingUp, Sparkles, Link as LinkIcon, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { getAvailableCampaigns } from "@/app/actions/campaign";
import { generateCampaignContent } from "@/app/actions/ai";
import { useToast } from "@/components/ui/toast-provider";
import type { Campaign } from "@/lib/types";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function PromoterDashboard() {
    const t = useTranslations('Dashboard');
    const { toast } = useToast();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [generatingForId, setGeneratingForId] = useState<string | null>(null);

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAvailableCampaigns();
            if (result.success) {
                setCampaigns(result.campaigns || []);
            } else {
                setError(result.error || 'Failed to load campaigns');
            }
        } catch (err) {
            console.error("Failed to load campaigns", err);
            setError('Failed to load campaigns. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const handleCopyLink = async (campaignId: string, campaignName: string) => {
        // Generate a share link (for pilot, use a placeholder URL)
        const shareUrl = `${window.location.origin}/ref/${campaignId}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast(`Share link for "${campaignName}" copied to clipboard!`, 'success');
        } catch {
            toast('Failed to copy link. Please try again.', 'error');
        }
    };

    const handleGenerateAIText = async (campaign: Campaign) => {
        setGeneratingForId(campaign.id);
        try {
            const result = await generateCampaignContent({
                description: campaign.description,
                platforms: ['whatsapp'],
                language: 'he',
            });
            if (result.success && result.content?.whatsapp) {
                await navigator.clipboard.writeText(result.content.whatsapp);
                toast('AI text generated and copied to clipboard!', 'success');
            } else {
                toast(result.error || 'Failed to generate AI text', 'error');
            }
        } catch {
            toast('Failed to generate AI text. Please try again.', 'error');
        } finally {
            setGeneratingForId(null);
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <div>
                <h1 className="text-3xl font-bold text-slate-900">{t('promoter')}</h1>
                <p className="text-slate-500 mt-1">Find campaigns and track your earnings</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <motion.div variants={item}>
                    <Card className="border-0 shadow-lg shadow-green-900/5 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">My Earnings</CardTitle>
                            <Wallet className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{'\u20AA'} 0</div>
                            <p className="text-xs text-slate-500 mt-1">Pending payout (Manual)</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="border-0 shadow-lg shadow-blue-900/5 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Total Clicks</CardTitle>
                            <MousePointerClick className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">0</div>
                            <p className="text-xs text-green-600 flex items-center mt-1">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                +0% this week
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="border-0 shadow-lg shadow-purple-900/5 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Conversions</CardTitle>
                            <Sparkles className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">0</div>
                            <p className="text-xs text-slate-500 mt-1">0% conversion rate</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <motion.div variants={item}>
                <h2 className="text-xl font-semibold mb-4 text-slate-900">Available Campaigns</h2>

                {/* Error State */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-12 bg-red-50/50 rounded-lg border border-red-200">
                        <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
                        <p className="text-red-700 font-medium mb-3">{error}</p>
                        <Button
                            variant="outline"
                            onClick={fetchCampaigns}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Loading State */}
                {loading && !error && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && campaigns.length === 0 && (
                    <div className="text-center py-12 bg-white/50 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">No active campaigns found at the moment.</p>
                    </div>
                )}

                {/* Campaign Cards */}
                {!loading && !error && campaigns.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.map((campaign) => (
                            <Card key={campaign.id} className="border-0 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl hover:translate-y-[-4px] transition-all duration-300">
                                <CardHeader>
                                    <CardTitle className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-lg">{campaign.name}</span>
                                            {campaign.provider && (
                                                <span className="text-xs text-muted-foreground font-normal">by {campaign.provider.name}</span>
                                            )}
                                        </div>
                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 whitespace-nowrap ml-2">
                                            {campaign.commission}% Comm.
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                                        {campaign.description}
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/10"
                                            size="sm"
                                            onClick={() => handleCopyLink(campaign.id, campaign.name)}
                                        >
                                            <LinkIcon className="mr-2 h-3 w-3" /> Link
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full border-slate-200 hover:bg-slate-50"
                                            size="sm"
                                            onClick={() => handleGenerateAIText(campaign)}
                                            disabled={generatingForId === campaign.id}
                                        >
                                            {generatingForId === campaign.id ? (
                                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="mr-2 h-3 w-3 text-purple-600" />
                                            )}
                                            AI Text
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
