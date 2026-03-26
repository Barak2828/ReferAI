"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
    ArrowRight, TrendingUp, Users, Link2, FileText, Loader2,
    Pause, Play, ExternalLink, Copy, Eye, MousePointerClick,
    BarChart3, Instagram, MessageSquare, Linkedin, Mail, Share2,
    Pencil, Trash2, Save, X, Download, ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCampaignDetails, toggleCampaignActive, updateCampaign, deleteCampaign, updateLeadStatus } from "@/app/actions/campaign";

interface CampaignDetail {
    id: string;
    name: string;
    description: string;
    commission: number;
    cta: string;
    isActive: boolean;
    createdAt: string;
    contents: Array<{ id: string; type: string; language: string; text: string; createdAt: string }>;
    leads: Array<{ id: string; name: string | null; contact: string | null; status: string; value: number | null; commission: number | null; createdAt: string }>;
    shareLinks: Array<{ id: string; code: string; clicks: number; createdAt: string }>;
}

const contentTypeLabels: Record<string, string> = {
    WHATSAPP_TEXT: "WhatsApp",
    INSTAGRAM_CAPTION: "Instagram",
    LINKEDIN_POST: "LinkedIn",
    FACEBOOK_POST: "Facebook",
    TWITTER_POST: "Twitter/X",
    TIKTOK_CAPTION: "TikTok",
    EMAIL_BODY: "Email",
};

const channelIcons: Record<string, React.ReactNode> = {
    WHATSAPP_TEXT: <MessageSquare className="h-4 w-4" />,
    INSTAGRAM_CAPTION: <Instagram className="h-4 w-4" />,
    LINKEDIN_POST: <Linkedin className="h-4 w-4" />,
    FACEBOOK_POST: <Share2 className="h-4 w-4" />,
    TWITTER_POST: <MessageSquare className="h-4 w-4" />,
    EMAIL_BODY: <Mail className="h-4 w-4" />,
};

const channelColors: Record<string, string> = {
    WHATSAPP_TEXT: "from-green-500/20 to-green-600/10 border-green-500/30",
    INSTAGRAM_CAPTION: "from-pink-500/20 to-purple-600/10 border-pink-500/30",
    LINKEDIN_POST: "from-blue-500/20 to-blue-700/10 border-blue-500/30",
    FACEBOOK_POST: "from-blue-400/20 to-blue-500/10 border-blue-400/30",
    TWITTER_POST: "from-sky-400/20 to-sky-500/10 border-sky-400/30",
    EMAIL_BODY: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
};

const channelTextColors: Record<string, string> = {
    WHATSAPP_TEXT: "text-green-400",
    INSTAGRAM_CAPTION: "text-pink-400",
    LINKEDIN_POST: "text-blue-400",
    FACEBOOK_POST: "text-blue-300",
    TWITTER_POST: "text-sky-400",
    EMAIL_BODY: "text-indigo-400",
};

const statusColors: Record<string, string> = {
    NEW: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    CONTACTED: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
    CLOSED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    LOST: "bg-red-500/10 text-red-300 border-red-500/30",
};

export default function CampaignDetailPage() {
    const t = useTranslations("Dashboard");
    const locale = useLocale();
    const params = useParams();
    const { toast } = useToast();
    const campaignId = params.id as string;

    const router = useRouter();
    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'leads' | 'links'>('overview');

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', description: '', commission: 0, cta: '' });

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getCampaignDetails(campaignId);
            setCampaign(data as CampaignDetail | null);
            setLoading(false);
        }
        load();
    }, [campaignId]);

    const handleToggle = async () => {
        if (!campaign) return;
        setToggling(true);
        const result = await toggleCampaignActive(campaignId);
        if (result.success) {
            setCampaign({ ...campaign, isActive: result.isActive! });
            toast({ title: result.isActive ? t("active") : t("paused"), variant: "success" });
        } else {
            toast({ title: t("toastError"), description: result.error, variant: "error" });
        }
        setToggling(false);
    };

    const handleCopyContent = async (text: string, platform: string) => {
        await navigator.clipboard.writeText(text);
        toast({ title: t("toastCopied"), description: `${platform}`, variant: "success" });
    };

    const handleStartEdit = () => {
        if (!campaign) return;
        setEditForm({ name: campaign.name, description: campaign.description, commission: campaign.commission, cta: campaign.cta });
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        const result = await updateCampaign(campaignId, editForm);
        if (result.success) {
            setCampaign(prev => prev ? { ...prev, ...editForm } : prev);
            setIsEditing(false);
            toast({ title: t("toastProfileUpdated"), variant: "success" });
        } else {
            toast({ title: t("toastError"), description: result.error, variant: "error" });
        }
        setIsSaving(false);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteCampaign(campaignId);
        if (result.success) {
            toast({ title: t("campaignDeleted") || "Campaign deleted", variant: "success" });
            router.push(`/${locale}/dashboard/provider`);
        } else {
            toast({ title: t("toastError"), description: result.error, variant: "error" });
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="text-center py-20 space-y-4">
                <p className="text-muted-foreground text-lg">{t("campaignNotFound")}</p>
                <Link href={`/${locale}/dashboard/provider`}>
                    <Button variant="outline" className="border-white/10">{t("backToDashboard")}</Button>
                </Link>
            </div>
        );
    }

    // Computed metrics
    const totalClicks = campaign.shareLinks.reduce((sum, l) => sum + l.clicks, 0);
    const closedLeads = campaign.leads.filter(l => l.status === 'CLOSED').length;
    const totalRevenue = campaign.leads.filter(l => l.status === 'CLOSED').reduce((sum, l) => sum + (l.value || 0), 0);
    const conversionRate = totalClicks > 0 ? ((closedLeads / totalClicks) * 100).toFixed(1) : '0';

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    const tabs = [
        { key: 'overview' as const, label: t('campaignOverview'), icon: <BarChart3 className="h-4 w-4" /> },
        { key: 'content' as const, label: t('campaignContents'), icon: <FileText className="h-4 w-4" />, count: campaign.contents.length },
        { key: 'leads' as const, label: t('campaignLeads'), icon: <TrendingUp className="h-4 w-4" />, count: campaign.leads.length },
        { key: 'links' as const, label: t('campaignShareLinks'), icon: <Link2 className="h-4 w-4" />, count: campaign.shareLinks.length },
    ];

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                    <Link href={`/${locale}/dashboard/provider`} className="text-sm text-muted-foreground hover:text-primary mb-2 inline-flex items-center gap-1">
                        <ArrowRight className="h-3 w-3 rotate-180" /> {t("backToDashboard")}
                    </Link>
                    {isEditing ? (
                        <div className="space-y-3 mt-2">
                            <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="text-2xl font-bold bg-navy-800/50 border-white/10" placeholder={t("campaignNameLabel")} />
                            <Input value={editForm.description} onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))} className="bg-navy-800/50 border-white/10" placeholder={t("descriptionLabel")} />
                            <div className="flex gap-3">
                                <Input value={editForm.cta} onChange={(e) => setEditForm(prev => ({ ...prev, cta: e.target.value }))} className="bg-navy-800/50 border-white/10" placeholder={t("callToActionLabel")} />
                                <Input type="number" value={editForm.commission} onChange={(e) => setEditForm(prev => ({ ...prev, commission: parseFloat(e.target.value) || 0 }))} className="bg-navy-800/50 border-white/10 w-32" placeholder="%" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-foreground">{campaign.name}</h1>
                            <p className="text-muted-foreground mt-1">{campaign.description}</p>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleSaveEdit} disabled={isSaving}>
                                {isSaving ? <Loader2 className="me-2 h-3 w-3 animate-spin" /> : <Save className="me-2 h-3 w-3" />}
                                {t("saveChanges")}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                <X className="me-1 h-3 w-3" /> {t("cancelButton") || "Cancel"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Badge variant={campaign.isActive ? "success" : "default"}>
                                {campaign.isActive ? t("active") : t("paused")}
                            </Badge>
                            <Button variant="outline" size="sm" className="border-white/10" onClick={handleStartEdit}>
                                <Pencil className="me-2 h-3 w-3" />
                                {t("editCampaign") || "Edit"}
                            </Button>
                            <Button variant="outline" size="sm" className="border-white/10" onClick={handleToggle} disabled={toggling}>
                                {toggling ? <Loader2 className="me-2 h-3 w-3 animate-spin" /> : campaign.isActive ? <Pause className="me-2 h-3 w-3" /> : <Play className="me-2 h-3 w-3" />}
                                {campaign.isActive ? t("pauseCampaign") : t("activateCampaign")}
                            </Button>
                            <Button variant="outline" size="sm" className="border-red-500/20 text-red-400 hover:bg-red-500/10" onClick={() => setShowDeleteConfirm(true)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="glass rounded-xl p-4 border border-red-500/20 flex items-center justify-between">
                    <p className="text-sm text-red-300">{t("deleteCampaignConfirm") || "Are you sure you want to delete this campaign? This action cannot be undone."}</p>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>{t("cancelButton") || "Cancel"}</Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="me-2 h-3 w-3 animate-spin" /> : <Trash2 className="me-2 h-3 w-3" />}
                            {t("deleteCampaign") || "Delete"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-4">
                <motion.div variants={item}>
                    <StatsCard title={t("leads")} value={campaign.leads.length} icon={<TrendingUp className="h-5 w-5" />} accentColor="blue" />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard title={t("totalClicks")} value={totalClicks} icon={<MousePointerClick className="h-5 w-5" />} accentColor="purple" />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard title={t("conversionRate")} value={`${conversionRate}%`} icon={<BarChart3 className="h-5 w-5" />} accentColor="green" />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard title={t("totalRevenue")} value={`₪ ${totalRevenue.toLocaleString()}`} icon={<Users className="h-5 w-5" />} accentColor="indigo" />
                </motion.div>
            </div>

            {/* Tabs */}
            <motion.div variants={item} className="flex gap-1 p-1 glass rounded-xl">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                            activeTab === tab.key
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'text-muted-foreground hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.count !== undefined && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary/30' : 'bg-white/10'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </motion.div>

            {/* Tab Content: Overview */}
            {activeTab === 'overview' && (
                <motion.div variants={item} className="space-y-6">
                    {/* Campaign Info */}
                    <div className="glass rounded-xl p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">{t("campaignDetailsPageTitle")}</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("campaignCommission")}</span>
                                <p className="text-foreground font-medium mt-1">{campaign.commission}%</p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("campaignCTA")}</span>
                                <p className="text-foreground font-medium mt-1 flex items-center gap-1">
                                    {campaign.cta || "-"}
                                    {campaign.cta && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">{t("campaignCreated")}</span>
                                <p className="text-foreground font-medium mt-1">{new Date(campaign.createdAt).toLocaleDateString(locale === "he" ? "he-IL" : "en-US")}</p>
                            </div>
                        </div>
                    </div>

                    {/* Per-Channel Performance */}
                    <div>
                        <h2 className="text-lg font-semibold text-foreground mb-4">{t("channelPerformance")}</h2>
                        {campaign.contents.length === 0 ? (
                            <div className="glass rounded-xl p-8 text-center">
                                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">{t("noContentYet")}</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {campaign.contents.map((content) => {
                                    const channelLabel = contentTypeLabels[content.type] || content.type;
                                    const colorClass = channelColors[content.type] || 'from-gray-500/20 to-gray-600/10 border-gray-500/30';
                                    const textColor = channelTextColors[content.type] || 'text-gray-400';
                                    const icon = channelIcons[content.type] || <FileText className="h-4 w-4" />;

                                    // Calculate per-channel estimated metrics from share links
                                    const channelClicks = Math.round(totalClicks / Math.max(campaign.contents.length, 1));
                                    const channelLeads = Math.round(campaign.leads.length / Math.max(campaign.contents.length, 1));

                                    return (
                                        <motion.div
                                            key={content.id}
                                            whileHover={{ scale: 1.02 }}
                                            className={`rounded-xl p-5 border bg-gradient-to-br ${colorClass} cursor-pointer transition-all`}
                                            onClick={() => setActiveTab('content')}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={textColor}>{icon}</span>
                                                    <span className={`font-semibold text-sm ${textColor}`}>{channelLabel}</span>
                                                </div>
                                                <Badge variant="default" className="text-xs">{content.language.toUpperCase()}</Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-foreground">{channelClicks}</p>
                                                    <p className="text-xs text-muted-foreground">{t("totalClicks")}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-foreground">{channelLeads}</p>
                                                    <p className="text-xs text-muted-foreground">{t("leads")}</p>
                                                </div>
                                            </div>

                                            <p className="text-xs text-muted-foreground line-clamp-2">{content.text}</p>

                                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{new Date(content.createdAt).toLocaleDateString(locale === "he" ? "he-IL" : "en-US")}</span>
                                                <span className="flex items-center gap-1 text-primary">
                                                    {t("viewDetails")} <ArrowRight className="h-3 w-3" />
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Channel Distribution + Top Collaborators (Stitch design) */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Channel Distribution Donut */}
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">Channel Distribution</h2>
                            <div className="flex justify-center py-4">
                                <div className="relative w-32 h-32">
                                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                        {(() => {
                                            const types = campaign.contents.map(c => c.type);
                                            const unique = Array.from(new Set(types));
                                            const colors: Record<string, string> = {
                                                WHATSAPP_TEXT: '#25D366', INSTAGRAM_CAPTION: '#E1306C',
                                                FACEBOOK_POST: '#1877F2', LINKEDIN_POST: '#0A66C2',
                                                TWITTER_POST: '#1DA1F2', EMAIL_BODY: '#6366F1',
                                            };
                                            let offset = 0;
                                            return unique.map((type) => {
                                                const count = types.filter(t => t === type).length;
                                                const pct = (count / types.length) * 88;
                                                const el = (
                                                    <circle key={type} cx="18" cy="18" r="14" fill="none"
                                                        stroke={colors[type] || '#666'} strokeWidth="4"
                                                        strokeDasharray={`${pct} ${88 - pct}`}
                                                        strokeDashoffset={`-${offset}`} />
                                                );
                                                offset += pct;
                                                return el;
                                            });
                                        })()}
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-foreground">{campaign.contents.length}</div>
                                            <div className="text-[10px] text-muted-foreground">Posts</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 mt-2">
                                {Array.from(new Set(campaign.contents.map(c => c.type))).map(type => {
                                    const label = contentTypeLabels[type] || type;
                                    const textColor = channelTextColors[type] || 'text-gray-400';
                                    const count = campaign.contents.filter(c => c.type === type).length;
                                    return (
                                        <div key={type} className="flex items-center justify-between text-sm">
                                            <span className={`${textColor}`}>{label}</span>
                                            <span className="font-medium text-foreground">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* AI-Generated Insights */}
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">AI Insights</h2>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                    <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-muted-foreground">
                                        {closedLeads > 0
                                            ? `${closedLeads} leads converted with a ${conversionRate}% conversion rate. Revenue: ₪${totalRevenue.toLocaleString()}`
                                            : 'No conversions yet. Share your campaign link to start generating leads.'}
                                    </p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                    <BarChart3 className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-muted-foreground">
                                        {campaign.contents.length > 0
                                            ? `Content published on ${campaign.contents.length} channels. ${totalClicks} total link clicks recorded.`
                                            : 'Generate AI content in the campaign wizard to start publishing.'}
                                    </p>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                                    <Users className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-muted-foreground">
                                        {campaign.shareLinks.length > 0
                                            ? `${campaign.shareLinks.length} share links active. Top link: ${campaign.shareLinks.reduce((max, l) => l.clicks > max.clicks ? l : max, campaign.shareLinks[0]).clicks} clicks.`
                                            : 'Create share links to track promoter performance.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Conversion Funnel */}
                    <div className="glass rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">{t("conversionFunnel")}</h2>
                        <div className="flex items-center justify-between gap-2">
                            {[
                                { label: t("totalClicks"), value: totalClicks, color: 'bg-blue-500' },
                                { label: t("leads"), value: campaign.leads.length, color: 'bg-purple-500' },
                                { label: t("contacted"), value: campaign.leads.filter(l => l.status === 'CONTACTED' || l.status === 'CLOSED').length, color: 'bg-yellow-500' },
                                { label: t("closed"), value: closedLeads, color: 'bg-emerald-500' },
                            ].map((stage, i) => (
                                <div key={i} className="flex-1 text-center">
                                    <div className="relative mb-2">
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                                                style={{ width: `${totalClicks > 0 ? Math.max((stage.value / totalClicks) * 100, 5) : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-foreground">{stage.value}</p>
                                    <p className="text-xs text-muted-foreground">{stage.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Tab Content: Content */}
            {activeTab === 'content' && (
                <motion.div variants={item} className="space-y-4">
                    {campaign.contents.length === 0 ? (
                        <div className="glass rounded-xl p-8 text-center">
                            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">{t("noContentYet")}</p>
                        </div>
                    ) : (
                        campaign.contents.map((content) => {
                            const channelLabel = contentTypeLabels[content.type] || content.type;
                            const textColor = channelTextColors[content.type] || 'text-gray-400';
                            const icon = channelIcons[content.type] || <FileText className="h-4 w-4" />;

                            return (
                                <div key={content.id} className="glass rounded-xl p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center ${textColor}`}>
                                                {icon}
                                            </div>
                                            <div>
                                                <h3 className={`font-semibold ${textColor}`}>{channelLabel}</h3>
                                                <p className="text-xs text-muted-foreground">{content.language.toUpperCase()} · {new Date(content.createdAt).toLocaleDateString(locale === "he" ? "he-IL" : "en-US")}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-primary"
                                            onClick={() => handleCopyContent(content.text, channelLabel)}
                                        >
                                            <Copy className="h-4 w-4 me-1" /> {t("socialCopyButton")}
                                        </Button>
                                    </div>

                                    <div className="bg-white/[0.03] rounded-lg p-4 border border-white/5">
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">{content.text}</p>
                                    </div>

                                    {/* Channel-specific metrics placeholder */}
                                    <div className="grid grid-cols-4 gap-4 pt-2 border-t border-white/5">
                                        <div className="text-center">
                                            <Eye className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                                            <p className="text-sm font-medium text-foreground">—</p>
                                            <p className="text-xs text-muted-foreground">{t("views")}</p>
                                        </div>
                                        <div className="text-center">
                                            <MousePointerClick className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                                            <p className="text-sm font-medium text-foreground">{Math.round(totalClicks / Math.max(campaign.contents.length, 1))}</p>
                                            <p className="text-xs text-muted-foreground">{t("totalClicks")}</p>
                                        </div>
                                        <div className="text-center">
                                            <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                                            <p className="text-sm font-medium text-foreground">{Math.round(campaign.leads.length / Math.max(campaign.contents.length, 1))}</p>
                                            <p className="text-xs text-muted-foreground">{t("leads")}</p>
                                        </div>
                                        <div className="text-center">
                                            <BarChart3 className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                                            <p className="text-sm font-medium text-foreground">—</p>
                                            <p className="text-xs text-muted-foreground">{t("engagement")}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </motion.div>
            )}

            {/* Tab Content: Leads */}
            {activeTab === 'leads' && (
                <motion.div variants={item}>
                    {campaign.leads.length === 0 ? (
                        <div className="glass rounded-xl p-8 text-center">
                            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">{t("noLeadsYet")}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-white/10 gap-2"
                                    onClick={() => {
                                        const rows = [
                                            ['Name', 'Contact', 'Status', 'Value', 'Commission', 'Date'],
                                            ...campaign.leads.map(l => [
                                                l.name || '', l.contact || '', l.status,
                                                l.value != null ? String(l.value) : '',
                                                l.commission != null ? String(l.commission) : '',
                                                new Date(l.createdAt).toLocaleDateString(),
                                            ]),
                                        ];
                                        const csv = rows.map(r => r.join(',')).join('\n');
                                        const blob = new Blob([csv], { type: 'text/csv' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${campaign.name}-leads.csv`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    }}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    {t('exportLeads') || 'Export CSV'}
                                </Button>
                            </div>
                            <div className="glass rounded-xl overflow-hidden">
                                <div className="border-b border-white/5 bg-white/[0.02] p-4 grid grid-cols-5 font-medium text-sm text-muted-foreground">
                                    <div>{t("campaignName")}</div>
                                    <div>{t("leadContact")}</div>
                                    <div>{t("status")}</div>
                                    <div>{t("leadValue")}</div>
                                    <div>{t("leadDate")}</div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {campaign.leads.map((lead) => (
                                        <div key={lead.id} className="p-4 grid grid-cols-5 items-center text-sm hover:bg-white/[0.02] transition-colors">
                                            <div className="font-medium text-foreground">{lead.name || "-"}</div>
                                            <div className="text-muted-foreground">{lead.contact || "-"}</div>
                                            <div>
                                                <select
                                                    value={lead.status}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value as 'NEW' | 'CONTACTED' | 'CLOSED' | 'LOST';
                                                        const result = await updateLeadStatus(lead.id, newStatus);
                                                        if (result.success) {
                                                            // Update local state
                                                            setCampaign(prev => prev ? {
                                                                ...prev,
                                                                leads: prev.leads.map(l =>
                                                                    l.id === lead.id ? { ...l, status: newStatus } : l
                                                                ),
                                                            } : prev);
                                                            toast({ title: 'Lead status updated', variant: 'success' });
                                                        } else {
                                                            toast({ title: t('toastError'), description: result.error, variant: 'error' });
                                                        }
                                                    }}
                                                    className={`px-2 py-1 rounded-lg text-xs font-medium border bg-transparent cursor-pointer ${statusColors[lead.status] || "text-muted-foreground"}`}
                                                >
                                                    <option value="NEW">NEW</option>
                                                    <option value="CONTACTED">CONTACTED</option>
                                                    <option value="CLOSED">CLOSED</option>
                                                    <option value="LOST">LOST</option>
                                                </select>
                                            </div>
                                            <div className="text-muted-foreground">{lead.value != null ? `${lead.value.toLocaleString()} ₪` : "-"}</div>
                                            <div className="text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString(locale === "he" ? "he-IL" : "en-US")}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Tab Content: Share Links */}
            {activeTab === 'links' && (
                <motion.div variants={item}>
                    {campaign.shareLinks.length === 0 ? (
                        <div className="glass rounded-xl p-8 text-center">
                            <Link2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">{t("noShareLinksYet")}</p>
                        </div>
                    ) : (
                        <div className="glass rounded-xl overflow-hidden">
                            <div className="border-b border-white/5 bg-white/[0.02] p-4 grid grid-cols-4 font-medium text-sm text-muted-foreground">
                                <div>{t("shareLink")}</div>
                                <div>{t("totalClicks")}</div>
                                <div>{t("conversionRate")}</div>
                                <div>{t("leadDate")}</div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {campaign.shareLinks.map((link) => (
                                    <div key={link.id} className="p-4 grid grid-cols-4 items-center text-sm hover:bg-white/[0.02] transition-colors">
                                        <div className="font-mono text-primary text-xs">/r/{link.code}</div>
                                        <div className="text-foreground font-medium">{link.clicks}</div>
                                        <div className="text-muted-foreground">
                                            {link.clicks > 0 ? `${((campaign.leads.length / link.clicks) * 100).toFixed(1)}%` : '0%'}
                                        </div>
                                        <div className="text-muted-foreground">{new Date(link.createdAt).toLocaleDateString(locale === "he" ? "he-IL" : "en-US")}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}
