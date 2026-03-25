"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressStepper } from "@/components/ui/progress-stepper";
import { AIProviderBadge } from "@/components/ui/ai-provider-badge";
import { RionaStatusBadge } from "@/components/ui/riona-status-badge";
import { PlatformPublishCard } from "@/components/ui/platform-publish-card";
import { AccountConnectModal } from "@/components/ui/account-connect-modal";
import { useToast } from "@/components/ui/toast";
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useLocale } from "next-intl";
import { generateCampaignContent, generateCampaignImage, generateCampaignVideo, getSmartPrompts, type ImageProvider, type VideoProvider } from "@/app/actions/ai";
import type { MediaAssetResult, PromptVariant } from "@/lib/riona/client";
import { createCampaign } from "@/app/actions/campaign";
import {
    getRionaStatus,
    loginInstagram,
    publishToPlatform,
    getFacebookAuthUrl,
    getInstagramAuthUrl,
    getGoogleAuthUrl,
    connectWhatsApp as connectWhatsAppAction,
} from "@/app/actions/social";
import {
    Loader2, Check, Copy, Sparkles, Instagram,
    Send, Zap, Globe, MessageSquare, ImageIcon, Video, Wand2, Brain,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AIProvider } from "@/types";
import type { PublishJobStatus, SocialAccount, SocialPlatform } from "@/lib/riona/types";

/** Safely extract text from AI content */
function getContentText(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        if (obj.subject && obj.body) return `${obj.subject}\n\n${obj.body}`;
        return JSON.stringify(value, null, 2);
    }
    return String(value ?? '');
}

const platformConfig: Record<string, { label: string; color: string; activeColor: string; comingSoon?: boolean }> = {
    whatsapp: { label: 'WhatsApp', color: 'border-white/10', activeColor: 'border-green-500 bg-green-500/10 text-green-300' },
    instagram: { label: 'Instagram', color: 'border-white/10', activeColor: 'border-pink-500 bg-pink-500/10 text-pink-300' },
    facebook: { label: 'Facebook', color: 'border-white/10', activeColor: 'border-blue-500 bg-blue-500/10 text-blue-300' },
    youtube: { label: 'YouTube', color: 'border-white/10', activeColor: 'border-red-500 bg-red-500/10 text-red-300' },
    google_business: { label: 'Google Business', color: 'border-white/10', activeColor: 'border-amber-500 bg-amber-500/10 text-amber-300' },
    linkedin: { label: 'LinkedIn', color: 'border-white/10', activeColor: 'border-blue-600 bg-blue-600/10 text-blue-300', comingSoon: true },
    twitter: { label: 'Twitter/X', color: 'border-white/10', activeColor: 'border-sky-500 bg-sky-500/10 text-sky-300', comingSoon: true },
    tiktok: { label: 'TikTok', color: 'border-white/10', activeColor: 'border-white/30 bg-white/5 text-foreground', comingSoon: true },
    email: { label: 'Email', color: 'border-white/10', activeColor: 'border-indigo-500 bg-indigo-500/10 text-indigo-300', comingSoon: true },
};

/** Platform publish card config */
const publishPlatforms = [
    {
        key: 'instagram',
        platform: 'INSTAGRAM' as SocialPlatform,
        label: 'Instagram',
        iconColor: 'bg-pink-500/20',
        borderColor: 'border-pink-500/30',
        iconEl: <Instagram className="h-5 w-5 text-pink-400" />,
    },
    {
        key: 'facebook',
        platform: 'FACEBOOK' as SocialPlatform,
        label: 'Facebook Page',
        iconColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        iconEl: <Globe className="h-5 w-5 text-blue-400" />,
    },
    {
        key: 'youtube',
        platform: 'YOUTUBE' as SocialPlatform,
        label: 'YouTube',
        iconColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        iconEl: <Video className="h-5 w-5 text-red-400" />,
    },
    {
        key: 'google_business',
        platform: 'GOOGLE_BUSINESS' as SocialPlatform,
        label: 'Google Business',
        iconColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/30',
        iconEl: <Globe className="h-5 w-5 text-amber-400" />,
    },
    {
        key: 'whatsapp',
        platform: 'WHATSAPP' as SocialPlatform,
        label: 'WhatsApp',
        iconColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        iconEl: <MessageSquare className="h-5 w-5 text-green-400" />,
    },
];

export default function NewCampaignPage() {
    const t = useTranslations('Dashboard');
    const locale = useLocale();
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [language, setLanguage] = useState("he");
    const [aiProvider, setAiProvider] = useState<AIProvider>("openai");

    const [formData, setFormData] = useState({
        name: "", description: "", cta: "",
        commissionType: "percentage", commissionValue: "",
    });

    const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({
        whatsapp: true, instagram: true, facebook: false,
        youtube: false, google_business: false,
        linkedin: false, twitter: false, tiktok: false, email: false,
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<Record<string, string> | null>(null);
    const [usedProvider, setUsedProvider] = useState<AIProvider | null>(null);

    // Step 4: Publishing state
    const [rionaConnected, setRionaConnected] = useState(false);
    const [connectedAccounts, setConnectedAccounts] = useState<Record<string, SocialAccount | null>>({});
    const [publishStatuses, setPublishStatuses] = useState<Record<string, PublishJobStatus | 'IDLE'>>({});
    const [isPublishingPlatform, setIsPublishingPlatform] = useState<Record<string, boolean>>({});
    const [isPublishingAll, setIsPublishingAll] = useState(false);

    // Connect modal state
    const [connectModal, setConnectModal] = useState<{ open: boolean; platform: string }>({ open: false, platform: '' });
    const [isConnecting, setIsConnecting] = useState(false);

    // Instagram DM target / WhatsApp recipient
    const [dmTarget, setDmTarget] = useState("");

    // AI Image/Video generation state
    const [imageProvider, setImageProvider] = useState<ImageProvider>('dalle');
    const [videoProvider, setVideoProvider] = useState<VideoProvider>('veo');
    const [imagePrompt, setImagePrompt] = useState("");
    const [videoPrompt, setVideoPrompt] = useState("");
    const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
    const [videoAspectRatio, setVideoAspectRatio] = useState<'9:16' | '16:9'>('9:16');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<MediaAssetResult[]>([]);
    const [generatedVideo, setGeneratedVideo] = useState<MediaAssetResult | null>(null);
    const [selectedImageVariant, setSelectedImageVariant] = useState(0);

    // Smart Prompts state
    const [smartPromptsEnabled, setSmartPromptsEnabled] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [promptVariants, setPromptVariants] = useState<PromptVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<number | null>(null);

    useEffect(() => {
        getRionaStatus().then((status) => {
            setRionaConnected(status.serverReachable);
        });
    }, []);

    // Check for OAuth callback params
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const oauthSuccess = params.get('oauth_success');
        const oauthError = params.get('oauth_error');
        const accountName = params.get('account');

        if (oauthSuccess) {
            toast({ title: t('oauthSuccess'), description: `${oauthSuccess}: ${accountName}`, variant: 'success' });
            window.history.replaceState({}, '', window.location.pathname);
        }
        if (oauthError) {
            toast({ title: t('oauthError'), description: oauthError, variant: 'error' });
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePlatformToggle = (platform: string) => {
        setSelectedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
    };

    const handleGenerate = async () => {
        if (!formData.description) return;
        setIsGenerating(true);
        try {
            const platforms = Object.entries(selectedPlatforms)
                .filter(([, enabled]) => enabled)
                .map(([key]) => key);

            const result = await generateCampaignContent({
                description: formData.description,
                platforms,
                language,
                provider: aiProvider,
            });

            if (result.success && result.content) {
                setGeneratedContent(result.content);
                setUsedProvider(result.provider || aiProvider);
                toast({ title: t('toastContentGenerated'), description: `Generated by ${result.provider || aiProvider}`, variant: 'success' });
            } else {
                toast({ title: t('toastGenerationFailed'), description: result.error || 'Unknown error', variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async (text: unknown, platform: string) => {
        await navigator.clipboard.writeText(getContentText(text));
        toast({ title: t('toastCopied'), description: `${platform} content copied to clipboard`, variant: 'success' });
    };

    // ─── AI Image/Video Handlers ────────────────────────────

    const handleGenerateImage = async () => {
        if (!imagePrompt) return;
        setIsGeneratingImage(true);
        try {
            const result = await generateCampaignImage({
                prompt: imagePrompt,
                aspectRatio: imageAspectRatio as any,
                variants: 3,
                provider: imageProvider,
            });
            if (result.success && result.assets.length > 0) {
                setGeneratedImages(result.assets);
                setSelectedImageVariant(0);
                toast({ title: t('imageGenerated'), variant: 'success' });
            } else {
                toast({ title: t('toastError'), description: result.error || 'Image generation failed', variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleGenerateVideo = async () => {
        if (!videoPrompt) return;
        setIsGeneratingVideo(true);
        try {
            const result = await generateCampaignVideo({
                prompt: videoPrompt,
                aspectRatio: videoAspectRatio,
                provider: videoProvider,
            });
            if (result.success && result.assets.length > 0) {
                setGeneratedVideo(result.assets[0]);
                toast({ title: t('videoGenerated'), variant: 'success' });
            } else {
                toast({ title: t('toastError'), description: result.error || 'Video generation failed', variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    const handleSmartPrompts = async () => {
        setIsAnalyzing(true);
        try {
            const userId = 'demo-user-id'; // TODO: Get from auth context
            const result = await getSmartPrompts({
                userId,
                campaignDescription: formData.description,
                campaignName: formData.name,
                targetPlatform: Object.entries(selectedPlatforms).find(([, v]) => v)?.[0] || 'instagram',
                language,
            });
            if (result.success && result.variants.length > 0) {
                setPromptVariants(result.variants);
                toast({ title: t('channelAnalyzed'), variant: 'success' });
            } else {
                toast({ title: t('toastError'), description: 'No smart prompts generated', variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleApplyVariant = (variant: PromptVariant) => {
        setImagePrompt(variant.imagePrompt);
        setVideoPrompt(variant.videoPrompt);
    };

    // ─── Account Connection Handlers ──────────────────────────

    const handleConnectOAuth = async (platform: string) => {
        setIsConnecting(true);
        try {
            const baseUrl = window.location.origin;
            const userId = 'demo-user-id'; // TODO: Get from auth context

            if (platform === 'FACEBOOK') {
                const redirectUri = `${baseUrl}/api/oauth/facebook/callback`;
                const state = `${userId}|${locale}`;
                const result = await getFacebookAuthUrl(redirectUri, state);
                if (result.url) { window.location.href = result.url; return; }
            } else if (platform === 'GOOGLE_BUSINESS') {
                const redirectUri = `${baseUrl}/api/oauth/google/callback`;
                const state = `${userId}|${locale}|GOOGLE_BUSINESS`;
                const result = await getGoogleAuthUrl(redirectUri, state, 'business');
                if (result.url) { window.location.href = result.url; return; }
            } else if (platform === 'YOUTUBE') {
                const redirectUri = `${baseUrl}/api/oauth/google/callback`;
                const state = `${userId}|${locale}|YOUTUBE`;
                const result = await getGoogleAuthUrl(redirectUri, state, 'youtube');
                if (result.url) { window.location.href = result.url; return; }
            } else if (platform === 'INSTAGRAM') {
                const redirectUri = `${baseUrl}/api/oauth/instagram/callback`;
                const state = `${userId}|${locale}`;
                const result = await getInstagramAuthUrl(redirectUri, state);
                if (result.url) { window.location.href = result.url; return; }
            }
            toast({ title: t('oauthError'), description: 'Could not generate auth URL', variant: 'error' });
        } catch {
            toast({ title: t('oauthError'), variant: 'error' });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleConnectCredentials = async (platform: string, username: string, password: string) => {
        setIsConnecting(true);
        try {
            if (platform === 'INSTAGRAM') {
                const loginResult = await loginInstagram(username, password);
                if (loginResult.success) {
                    setConnectedAccounts(prev => ({
                        ...prev,
                        INSTAGRAM: { id: `ig-${username}`, platform: 'INSTAGRAM', username, isActive: true, lastUsedAt: null },
                    }));
                    setConnectModal({ open: false, platform: '' });
                    toast({ title: t('socialIgLoginSuccess'), variant: 'success' });
                } else {
                    toast({ title: t('toastError'), description: loginResult.message, variant: 'error' });
                }
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleConnectApiKey = async (apiToken: string, phoneNumberId: string, businessName: string) => {
        setIsConnecting(true);
        try {
            const userId = 'demo-user-id'; // TODO: Get from auth context
            const result = await connectWhatsAppAction(userId, apiToken, phoneNumberId, businessName);
            if (result.success && result.account) {
                setConnectedAccounts(prev => ({ ...prev, WHATSAPP: result.account! }));
                setConnectModal({ open: false, platform: '' });
                toast({ title: t('oauthSuccess'), variant: 'success' });
            } else {
                toast({ title: t('toastError'), description: result.message, variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setIsConnecting(false);
        }
    };

    // ─── Publishing Handlers ──────────────────────────────────

    const handlePublishSingle = async (platformKey: string, platformEnum: SocialPlatform) => {
        const account = connectedAccounts[platformEnum];
        if (!account || !generatedContent?.[platformKey]) return;

        setIsPublishingPlatform(prev => ({ ...prev, [platformKey]: true }));
        setPublishStatuses(prev => ({ ...prev, [platformKey]: 'PROCESSING' }));

        try {
            const contentText = getContentText(generatedContent[platformKey]);
            const contentMeta: Record<string, any> = {};

            // Attach generated image/video to publish request
            if (generatedImages.length > 0 && selectedImageVariant < generatedImages.length) {
                contentMeta.imageUrl = generatedImages[selectedImageVariant].url;
            }
            if (generatedVideo) {
                contentMeta.videoUrl = generatedVideo.url;
                // Mark as Shorts for YouTube if aspect ratio is 9:16
                if (platformEnum === 'YOUTUBE' && videoAspectRatio === '9:16') {
                    contentMeta.isShorts = true;
                }
            }

            if (platformEnum === 'INSTAGRAM' && dmTarget) {
                contentMeta.targetUsername = dmTarget;
            }
            if (platformEnum === 'WHATSAPP' && dmTarget) {
                contentMeta.recipientNumber = dmTarget;
            }

            const result = await publishToPlatform(
                platformEnum,
                account.id,
                'campaign-pending',
                contentText,
                contentMeta,
            );

            if (result.success) {
                setPublishStatuses(prev => ({ ...prev, [platformKey]: 'COMPLETED' }));
                toast({ title: t('publishSuccess'), description: `${platformConfig[platformKey]?.label || platformKey}`, variant: 'success' });
            } else {
                setPublishStatuses(prev => ({ ...prev, [platformKey]: 'FAILED' }));
                toast({ title: t('publishFailed'), description: result.error || result.result?.message, variant: 'error' });
            }
        } catch {
            setPublishStatuses(prev => ({ ...prev, [platformKey]: 'FAILED' }));
            toast({ title: t('publishFailed'), variant: 'error' });
        } finally {
            setIsPublishingPlatform(prev => ({ ...prev, [platformKey]: false }));
        }
    };

    const handlePublishAll = async () => {
        setIsPublishingAll(true);
        const platforms = publishPlatforms.filter(
            (p) => connectedAccounts[p.platform] && generatedContent?.[p.key],
        );

        for (const p of platforms) {
            await handlePublishSingle(p.key, p.platform);
        }
        setIsPublishingAll(false);
    };

    const handleLaunch = async () => {
        setIsLaunching(true);
        try {
            const result = await createCampaign({
                name: formData.name, description: formData.description,
                cta: formData.cta, commission: parseFloat(formData.commissionValue) || 0,
                generatedContent: generatedContent || undefined,
                contentLanguage: language,
            });
            if (result.success) {
                toast({ title: t('toastCampaignLaunched'), variant: 'success' });
                router.push(`/${locale}/dashboard/provider`);
            } else {
                toast({ title: t('toastError'), description: result.error || 'Failed to create campaign', variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setIsLaunching(false);
        }
    };

    const steps = [
        { label: t('campaignDetailsTitle') },
        { label: t('commissionRulesTitle') },
        { label: t('aiContentGenerationTitle') },
        { label: t('publishTitle') },
    ];

    const connectedCount = Object.values(connectedAccounts).filter(Boolean).length;
    const publishableCount = publishPlatforms.filter(
        (p) => connectedAccounts[p.platform] && generatedContent?.[p.key],
    ).length;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground mb-6">{t('createCampaign')}</h1>
                <ProgressStepper steps={steps} currentStep={step - 1} />
            </div>

            <div className="glass rounded-xl p-6 mt-8 space-y-6">
                <h2 className="text-lg font-semibold text-foreground">
                    {step === 1 && t('campaignDetailsTitle')}
                    {step === 2 && t('commissionRulesTitle')}
                    {step === 3 && t('aiContentGenerationTitle')}
                    {step === 4 && t('publishTitle')}
                </h2>

                {/* Step 1: Campaign Details */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('campaignNameLabel')}</label>
                            <Input name="name" placeholder={t('campaignNamePlaceholder')} value={formData.name} onChange={handleInputChange} className="bg-navy-800/50 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('descriptionLabel')}</label>
                            <Input name="description" placeholder={t('descriptionPlaceholder')} value={formData.description} onChange={handleInputChange} className="bg-navy-800/50 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('callToActionLabel')}</label>
                            <Input name="cta" placeholder={t('callToActionPlaceholder')} value={formData.cta} onChange={handleInputChange} className="bg-navy-800/50 border-white/10" />
                        </div>
                    </div>
                )}

                {/* Step 2: Commission Rules */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('commissionTypeLabel')}</label>
                            <div className="flex gap-4">
                                <Button
                                    variant={formData.commissionType === 'percentage' ? 'default' : 'outline'}
                                    className={cn("w-full", formData.commissionType !== 'percentage' && "border-white/10")}
                                    onClick={() => setFormData({ ...formData, commissionType: 'percentage' })}
                                >
                                    {t('percentageCommission')}
                                </Button>
                                <Button
                                    variant={formData.commissionType === 'fixed' ? 'default' : 'outline'}
                                    className={cn("w-full", formData.commissionType !== 'fixed' && "border-white/10")}
                                    onClick={() => setFormData({ ...formData, commissionType: 'fixed' })}
                                >
                                    {t('fixedAmountCommission')}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('commissionValueLabel')}</label>
                            <Input name="commissionValue" type="number" placeholder="10" value={formData.commissionValue} onChange={handleInputChange} className="bg-navy-800/50 border-white/10" />
                        </div>
                    </div>
                )}

                {/* Step 3: AI Content Engine */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="glass rounded-xl p-6 space-y-6 border border-primary/20">
                            <div>
                                <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    {t('aiContentEngineTextTitle')}
                                </h4>
                                <p className="text-sm text-muted-foreground">{t('aiContentEngineTextDescription')}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-3 text-muted-foreground">{t('aiEngine')}</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAiProvider('openai')}
                                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all border", aiProvider === 'openai' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-white/10 text-muted-foreground hover:bg-white/5')}
                                    >
                                        OpenAI
                                    </button>
                                    <button
                                        onClick={() => setAiProvider('anthropic')}
                                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all border", aiProvider === 'anthropic' ? 'border-orange-500 bg-orange-500/10 text-orange-300' : 'border-white/10 text-muted-foreground hover:bg-white/5')}
                                    >
                                        Anthropic
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-3 text-muted-foreground">{t('contentLanguageLabel')}</label>
                                <div className="flex gap-2">
                                    <Button variant={language === 'he' ? 'default' : 'outline'} onClick={() => setLanguage('he')} size="sm" className={cn("w-24", language !== 'he' && "border-white/10")}>
                                        {t('hebrewLanguage')}
                                    </Button>
                                    <Button variant={language === 'en' ? 'default' : 'outline'} onClick={() => setLanguage('en')} size="sm" className={cn("w-24", language !== 'en' && "border-white/10")}>
                                        {t('englishLanguage')}
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium block mb-3 text-muted-foreground">{t('targetPlatforms')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(platformConfig).map(([key, config]) => (
                                        <button
                                            key={key}
                                            onClick={() => !config.comingSoon && handlePlatformToggle(key)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                                                config.comingSoon
                                                    ? 'opacity-50 cursor-not-allowed border-white/5 text-muted-foreground'
                                                    : selectedPlatforms[key] ? config.activeColor : `${config.color} text-muted-foreground hover:bg-white/5`
                                            )}
                                            disabled={config.comingSoon}
                                        >
                                            {config.label}{config.comingSoon ? ` (${t('comingSoon')})` : ''}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20"
                                onClick={handleGenerate}
                                disabled={isGenerating || !formData.description}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                        {t('generatingContent')}
                                    </>
                                ) : (
                                    <>{t('previewTextButton')}</>
                                )}
                            </Button>
                        </div>

                        {generatedContent && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
                                    <Check className="h-5 w-5 text-emerald-400" />
                                    {t('generatedContent')}
                                    {usedProvider && <AIProviderBadge provider={usedProvider} />}
                                </h3>
                                <div className="grid gap-4">
                                    {Object.entries(generatedContent).map(([platform, text]) => (
                                        <div key={platform} className="glass rounded-lg p-4 relative group">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">{platform}</span>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleCopy(text, platform)}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <textarea
                                                className="w-full text-sm whitespace-pre-wrap leading-relaxed text-foreground/80 bg-transparent border border-white/5 rounded-lg p-2 resize-y min-h-[60px] focus:border-primary/30 focus:outline-none"
                                                value={getContentText(text)}
                                                onChange={(e) => {
                                                    setGeneratedContent((prev: any) => ({
                                                        ...prev,
                                                        [platform]: e.target.value,
                                                    }));
                                                }}
                                                rows={3}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Smart Prompts */}
                        <div className="glass rounded-xl p-6 space-y-4 border border-purple-500/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                                        <Brain className="h-4 w-4 text-purple-400" />
                                        {t('smartPromptTitle')}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">{t('smartPromptDesc')}</p>
                                </div>
                                <button
                                    onClick={() => setSmartPromptsEnabled(!smartPromptsEnabled)}
                                    className={cn(
                                        "w-11 h-6 rounded-full transition-colors relative",
                                        smartPromptsEnabled ? "bg-purple-500" : "bg-white/10"
                                    )}
                                >
                                    <span className={cn(
                                        "block w-4 h-4 rounded-full bg-white transition-transform absolute top-1",
                                        smartPromptsEnabled ? "translate-x-6" : "translate-x-1"
                                    )} />
                                </button>
                            </div>

                            {smartPromptsEnabled && (
                                <div className="space-y-4">
                                    <Button
                                        variant="outline"
                                        className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                                        onClick={handleSmartPrompts}
                                        disabled={isAnalyzing || !formData.description}
                                    >
                                        {isAnalyzing ? (
                                            <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t('analyzingChannel')}</>
                                        ) : (
                                            <><Wand2 className="me-2 h-4 w-4" />{t('analyzeChannel')}</>
                                        )}
                                    </Button>

                                    {promptVariants.length > 0 && (
                                        <div className="grid gap-3">
                                            {promptVariants.map((variant, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "glass rounded-lg p-4 border cursor-pointer transition-all",
                                                        selectedVariant === i
                                                            ? "border-purple-500/50 bg-purple-500/10"
                                                            : "border-white/5 hover:border-white/20"
                                                    )}
                                                    onClick={() => {
                                                        setSelectedVariant(i);
                                                        handleApplyVariant(variant);
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-semibold text-foreground">{variant.label}</span>
                                                        {selectedVariant === i && <Check className="h-4 w-4 text-purple-400" />}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{variant.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* AI Image Engine */}
                        <div className="glass rounded-xl p-6 space-y-4 border border-pink-500/20">
                            <div>
                                <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-pink-400" />
                                    {t('aiImageEngineTitle')}
                                </h4>
                                <p className="text-sm text-muted-foreground">{t('aiImageEngineDesc')}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">{t('imageProvider')}</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setImageProvider('dalle')}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                                                imageProvider === 'dalle'
                                                    ? "border-green-500 bg-green-500/10 text-green-300"
                                                    : "border-white/10 text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            {t('dalleProvider')}
                                        </button>
                                        <button
                                            onClick={() => setImageProvider('gemini')}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                                                imageProvider === 'gemini'
                                                    ? "border-blue-500 bg-blue-500/10 text-blue-300"
                                                    : "border-white/10 text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            {t('geminiProvider')}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">{t('imagePromptLabel')}</label>
                                    <Input
                                        placeholder={t('imagePromptPlaceholder')}
                                        value={imagePrompt}
                                        onChange={(e) => setImagePrompt(e.target.value)}
                                        className="bg-navy-800/50 border-white/10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">{t('aspectRatio')}</label>
                                    <div className="flex gap-2">
                                        {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
                                            <button
                                                key={ratio}
                                                onClick={() => setImageAspectRatio(ratio)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                                                    imageAspectRatio === ratio
                                                        ? "border-pink-500 bg-pink-500/10 text-pink-300"
                                                        : "border-white/10 text-muted-foreground hover:bg-white/5"
                                                )}
                                            >
                                                {ratio}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-lg shadow-pink-500/20"
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImage || !imagePrompt}
                                >
                                    {isGeneratingImage ? (
                                        <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t('generatingImage')}</>
                                    ) : (
                                        <><ImageIcon className="me-2 h-4 w-4" />{t('generateImage')} (3 {t('variants')})</>
                                    )}
                                </Button>
                            </div>

                            {/* Generated Image Variants */}
                            {generatedImages.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-emerald-400" />
                                        <span className="text-sm font-semibold text-foreground">{t('imageGenerated')}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {generatedImages.map((img, i) => (
                                            <div
                                                key={img.id}
                                                className={cn(
                                                    "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                                                    selectedImageVariant === i
                                                        ? "border-pink-500 ring-2 ring-pink-500/20"
                                                        : "border-white/10 hover:border-white/30"
                                                )}
                                                onClick={() => setSelectedImageVariant(i)}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={img.url}
                                                    alt={`${t('variant')} ${i + 1}`}
                                                    className="w-full aspect-square object-cover"
                                                />
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-center">
                                                    <span className="text-xs text-white">{t('variant')} {i + 1}</span>
                                                </div>
                                                {selectedImageVariant === i && (
                                                    <div className="absolute top-2 right-2 h-5 w-5 bg-pink-500 rounded-full flex items-center justify-center">
                                                        <Check className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Video Engine */}
                        <div className="glass rounded-xl p-6 space-y-4 border border-violet-500/20">
                            <div>
                                <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                                    <Video className="h-4 w-4 text-violet-400" />
                                    {t('aiVideoEngineTitle')}
                                </h4>
                                <p className="text-sm text-muted-foreground">{t('aiVideoEngineDesc')}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">{t('videoProvider')}</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setVideoProvider('veo')}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                                                videoProvider === 'veo'
                                                    ? "border-violet-500 bg-violet-500/10 text-violet-300"
                                                    : "border-white/10 text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            {t('veoProvider')}
                                        </button>
                                        <button
                                            onClick={() => setVideoProvider('fal')}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                                                videoProvider === 'fal'
                                                    ? "border-orange-500 bg-orange-500/10 text-orange-300"
                                                    : "border-white/10 text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            {t('falProvider')}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">{t('videoPromptLabel')}</label>
                                    <Input
                                        placeholder={t('videoPromptPlaceholder')}
                                        value={videoPrompt}
                                        onChange={(e) => setVideoPrompt(e.target.value)}
                                        className="bg-navy-800/50 border-white/10"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">{t('aspectRatio')}</label>
                                    <div className="flex gap-2">
                                        {(['9:16', '16:9'] as const).map((ratio) => (
                                            <button
                                                key={ratio}
                                                onClick={() => setVideoAspectRatio(ratio)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                                                    videoAspectRatio === ratio
                                                        ? "border-violet-500 bg-violet-500/10 text-violet-300"
                                                        : "border-white/10 text-muted-foreground hover:bg-white/5"
                                                )}
                                            >
                                                {ratio} {ratio === '9:16' ? '(Shorts/Reels)' : '(YouTube)'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20"
                                    onClick={handleGenerateVideo}
                                    disabled={isGeneratingVideo || !videoPrompt}
                                >
                                    {isGeneratingVideo ? (
                                        <><Loader2 className="me-2 h-4 w-4 animate-spin" />{t('generatingVideo')}</>
                                    ) : (
                                        <><Video className="me-2 h-4 w-4" />{t('generateVideo')}</>
                                    )}
                                </Button>
                            </div>

                            {/* Generated Video Preview */}
                            {generatedVideo && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-emerald-400" />
                                        <span className="text-sm font-semibold text-foreground">{t('videoGenerated')}</span>
                                    </div>
                                    <div className="rounded-lg overflow-hidden border border-white/10">
                                        <video
                                            src={generatedVideo.url}
                                            controls
                                            className="w-full max-h-80"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Publish & Connect */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">{t('publishDesc')}</p>
                            <RionaStatusBadge connected={rionaConnected} />
                        </div>

                        {!generatedContent ? (
                            <div className="glass rounded-xl p-8 text-center">
                                <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">{t('socialNoContent')}</p>
                                <Button variant="outline" size="sm" className="mt-3 border-white/10" onClick={() => setStep(3)}>
                                    {t('socialGoGenerate')}
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Connected accounts summary + Publish All */}
                                <div className="glass rounded-xl p-4 border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Zap className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{t('publishConnectAccounts')}</p>
                                            <p className="text-xs text-muted-foreground">{connectedCount} {t('connected')} &middot; {publishableCount} ready</p>
                                        </div>
                                    </div>
                                    {publishableCount > 1 && (
                                        <Button
                                            size="sm"
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                                            onClick={handlePublishAll}
                                            disabled={isPublishingAll}
                                        >
                                            {isPublishingAll ? (
                                                <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Send className="me-2 h-3.5 w-3.5" />
                                            )}
                                            {t('publishToAll')}
                                        </Button>
                                    )}
                                </div>

                                {/* Target input for Instagram DM / WhatsApp number */}
                                {(generatedContent.instagram || generatedContent.whatsapp) && (
                                    <div className="glass rounded-lg p-4 border border-white/5 space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Send className="h-3.5 w-3.5 text-muted-foreground" />
                                            {generatedContent.instagram ? t('socialTargetUsername') : t('whatsappRecipient')}
                                        </label>
                                        <Input
                                            placeholder={generatedContent.instagram ? "@username" : "+972..."}
                                            value={dmTarget}
                                            onChange={(e) => setDmTarget(e.target.value)}
                                            className="bg-navy-800/50 border-white/10"
                                            dir="ltr"
                                        />
                                    </div>
                                )}

                                {/* Per-platform publish cards */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {publishPlatforms
                                        .filter((p) => generatedContent[p.key])
                                        .map((p) => (
                                            <PlatformPublishCard
                                                key={p.key}
                                                platform={p.key}
                                                label={p.label}
                                                icon={p.iconEl}
                                                iconColor={p.iconColor}
                                                borderColor={p.borderColor}
                                                contentText={getContentText(generatedContent[p.key])}
                                                account={connectedAccounts[p.platform] || null}
                                                publishStatus={publishStatuses[p.key] || 'IDLE'}
                                                isPublishing={!!isPublishingPlatform[p.key]}
                                                onPublish={() => handlePublishSingle(p.key, p.platform)}
                                                onConnect={() => setConnectModal({ open: true, platform: p.platform })}
                                                onCopy={() => handleCopy(generatedContent[p.key], p.key)}
                                                t={t}
                                            />
                                        ))}
                                </div>

                                {/* Copy fallback for platforms without publish support */}
                                {Object.entries(generatedContent).some(([key]) => !publishPlatforms.find(p => p.key === key)) && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-muted-foreground">{t('socialCopyFallback')}</h4>
                                        {Object.entries(generatedContent)
                                            .filter(([key]) => !publishPlatforms.find(p => p.key === key))
                                            .map(([platform, text]) => (
                                                <div key={platform} className="glass rounded-lg p-3 flex items-center justify-between">
                                                    <span className={cn(
                                                        "text-xs font-bold uppercase tracking-wider",
                                                        platformConfig[platform]?.activeColor?.split(' ').pop() || 'text-muted-foreground'
                                                    )}>
                                                        {platformConfig[platform]?.label || platform}
                                                    </span>
                                                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary" onClick={() => handleCopy(text, platform)}>
                                                        <Copy className="h-3.5 w-3.5" />
                                                        {t('socialCopyButton')}
                                                    </Button>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                <div className="flex justify-between pt-6 border-t border-white/5">
                    <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
                        {t('backButton')}
                    </Button>
                    {step < 4 ? (
                        <Button onClick={() => setStep(step + 1)}>{t('nextButton')}</Button>
                    ) : (
                        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleLaunch} disabled={isLaunching}>
                            {isLaunching ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                            {t('launchCampaignButton')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Account Connect Modal */}
            <AccountConnectModal
                platform={connectModal.platform}
                isOpen={connectModal.open}
                onClose={() => setConnectModal({ open: false, platform: '' })}
                onConnectOAuth={handleConnectOAuth}
                onConnectCredentials={handleConnectCredentials}
                onConnectApiKey={handleConnectApiKey}
                isConnecting={isConnecting}
                t={t}
            />
        </div>
    );
}
