"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SocialAccountCard } from "@/components/ui/social-account-card";
import { RionaStatusBadge } from "@/components/ui/riona-status-badge";
import { AccountConnectModal } from "@/components/ui/account-connect-modal";
import { useToast } from "@/components/ui/toast";
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import {
    getLinkedAccounts, linkSocialAccount, unlinkSocialAccount, getRionaStatus,
    getFacebookAuthUrl, getInstagramAuthUrl, getGoogleAuthUrl,
    connectWhatsApp,
} from "@/app/actions/social";
import { createClient } from "@/lib/supabase/client";
import { User, Plus, Loader2, Instagram, Facebook, Youtube, MessageSquare, Building2 } from "lucide-react";
import type { SocialAccount, SocialPlatform } from "@/lib/riona/types";

const PLATFORM_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    INSTAGRAM: { label: 'Instagram', icon: Instagram, color: 'from-pink-600 to-purple-600' },
    FACEBOOK: { label: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-500' },
    YOUTUBE: { label: 'YouTube', icon: Youtube, color: 'from-red-600 to-red-500' },
    GOOGLE_BUSINESS: { label: 'Google Business', icon: Building2, color: 'from-amber-600 to-amber-500' },
    WHATSAPP: { label: 'WhatsApp', icon: MessageSquare, color: 'from-green-600 to-emerald-500' },
};

export default function ProfilePage() {
    const t = useTranslations('Dashboard');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // Auth state
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [userRole, setUserRole] = useState<string>('PROVIDER');

    // Social accounts
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [rionaConnected, setRionaConnected] = useState(false);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

    // Connect modal
    const [connectPlatform, setConnectPlatform] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Load user session and accounts
    useEffect(() => {
        async function init() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUserId(user.id);
                setUserEmail(user.email || '');
                setUserName(user.user_metadata?.name || user.user_metadata?.full_name || '');
                setUserRole(user.user_metadata?.role || 'PROVIDER');

                // Load connected social accounts
                const result = await getLinkedAccounts(user.id);
                if (result.success) {
                    setAccounts(result.accounts);
                }
            }
            setLoadingAccounts(false);

            // Check Riona status
            getRionaStatus().then((status) => setRionaConnected(status.serverReachable));
        }
        init();
    }, []);

    // Handle OAuth callback params
    useEffect(() => {
        const oauthSuccess = searchParams.get('oauth_success');
        const oauthError = searchParams.get('oauth_error');
        const accountName = searchParams.get('account');

        if (oauthSuccess) {
            toast({
                title: t('socialAccountLinked'),
                description: `${oauthSuccess}${accountName ? ` (@${accountName})` : ''} connected`,
                variant: 'success',
            });
            // Reload accounts after OAuth success
            if (userId) {
                getLinkedAccounts(userId).then(result => {
                    if (result.success) setAccounts(result.accounts);
                });
            }
            // Clean URL params
            router.replace(pathname);
        } else if (oauthError) {
            toast({ title: t('toastError'), description: decodeURIComponent(oauthError), variant: 'error' });
            router.replace(pathname);
        }
    }, [searchParams, userId]);

    const loadAccounts = useCallback(async () => {
        if (!userId) return;
        const result = await getLinkedAccounts(userId);
        if (result.success) setAccounts(result.accounts);
    }, [userId]);

    async function handleSubmit(formData: FormData) {
        const newLocale = formData.get('locale') as string;
        const result = await updateProfile(formData);
        if (result?.error) {
            toast({ title: t('toastError'), description: result.error, variant: 'error' });
        } else {
            toast({ title: t('toastProfileUpdated'), description: t('toastProfileUpdatedDesc'), variant: 'success' });
            if (newLocale && newLocale !== locale) {
                const newPath = pathname.replace(`/${locale}/`, `/${newLocale}/`);
                router.push(newPath);
            }
        }
    }

    async function handleConnectOAuth(platform: string) {
        if (!userId) return;
        setIsConnecting(true);
        try {
            const origin = window.location.origin;
            const state = `${userId}|${locale}|${platform}`;
            let authUrl = '';

            if (platform === 'INSTAGRAM') {
                const result = await getInstagramAuthUrl(`${origin}/api/oauth/instagram/callback`, state);
                authUrl = result.url;
            } else if (platform === 'FACEBOOK') {
                const result = await getFacebookAuthUrl(`${origin}/api/oauth/facebook/callback`, state);
                authUrl = result.url;
            } else if (platform === 'YOUTUBE') {
                const result = await getGoogleAuthUrl(`${origin}/api/oauth/google/callback`, state, 'youtube');
                authUrl = result.url;
            } else if (platform === 'GOOGLE_BUSINESS') {
                const result = await getGoogleAuthUrl(`${origin}/api/oauth/google/callback`, state, 'business');
                authUrl = result.url;
            }

            if (authUrl) {
                window.location.href = authUrl;
            } else {
                toast({ title: t('toastError'), description: 'Failed to get authorization URL', variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setIsConnecting(false);
            setIsModalOpen(false);
        }
    }

    async function handleConnectCredentials(platform: string, username: string, password: string) {
        if (!userId) return;
        setIsConnecting(true);
        try {
            const result = await linkSocialAccount(userId, platform as SocialPlatform, username, password);
            if (result.success && result.account) {
                setAccounts(prev => [...prev, result.account!]);
                toast({ title: t('socialAccountLinked'), variant: 'success' });
            } else {
                toast({ title: t('toastError'), description: result.error, variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setIsConnecting(false);
            setIsModalOpen(false);
        }
    }

    async function handleConnectApiKey(apiToken: string, phoneNumberId: string, businessName: string) {
        if (!userId) return;
        setIsConnecting(true);
        try {
            const result = await connectWhatsApp(userId, apiToken, phoneNumberId, businessName);
            if (result.success && result.account) {
                setAccounts(prev => [...prev, result.account!]);
                toast({ title: t('socialAccountLinked'), variant: 'success' });
            } else {
                toast({ title: t('toastError'), description: result.message, variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setIsConnecting(false);
            setIsModalOpen(false);
        }
    }

    async function handleUnlink(accountId: string) {
        if (!userId) return;
        setUnlinkingId(accountId);
        try {
            const result = await unlinkSocialAccount(accountId, userId);
            if (result.success) {
                setAccounts(prev => prev.filter(a => a.id !== accountId));
                toast({ title: t('socialAccountUnlinked'), variant: 'success' });
            } else {
                toast({ title: t('toastError'), description: result.error, variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setUnlinkingId(null);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-foreground">{t('profileSettings')}</h1>

            {/* Profile Form */}
            <div className="glass rounded-xl p-6 space-y-6">
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <User className="h-10 w-10 text-white" />
                    </div>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('fullName')}</label>
                            <Input name="name" defaultValue={userName} placeholder={t('fullNamePlaceholder')} required className="bg-navy-800/50 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('emailLabel') || 'Email'}</label>
                            <Input value={userEmail} disabled className="bg-navy-800/30 border-white/5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('role')}</label>
                            <Select name="role" defaultValue={userRole} className="bg-navy-800/50 border-white/10">
                                <option value="PROVIDER">{t('roleProvider')}</option>
                                <option value="PROMOTER">{t('rolePromoter')}</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('language')}</label>
                            <Select name="locale" defaultValue={locale} className="bg-navy-800/50 border-white/10">
                                <option value="he">{t('hebrewLanguage')}</option>
                                <option value="en">{t('englishLanguage')}</option>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('companyName') || 'Company Name'}</label>
                            <Input name="company" placeholder={t('companyPlaceholder') || 'Your business name'} className="bg-navy-800/50 border-white/10" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('website') || 'Website'}</label>
                            <Input name="website" type="url" placeholder="https://..." className="bg-navy-800/50 border-white/10" dir="ltr" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">{t('bio') || 'Bio'}</label>
                        <Input name="bio" placeholder={t('bioPlaceholder') || 'Tell us about your business'} className="bg-navy-800/50 border-white/10" />
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white">
                        {t('saveChanges')}
                    </Button>
                </form>

                {/* Connected AI Providers */}
                <div className="pt-4 border-t border-white/5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('connectedAIEngines')}</h3>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-xs">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-emerald-300">OpenAI (DALL-E 3 + GPT)</span>
                        </div>
                        <div className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-xs">
                            <span className="h-2 w-2 rounded-full bg-orange-400" />
                            <span className="text-orange-300">Anthropic (Claude)</span>
                        </div>
                        <div className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-xs">
                            <span className="h-2 w-2 rounded-full bg-violet-400" />
                            <span className="text-violet-300">fal.ai (Video)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connected Social Accounts */}
            <div className="glass rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">{t('socialConnectedAccounts')}</h2>
                    <RionaStatusBadge connected={rionaConnected} />
                </div>

                {loadingAccounts ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : accounts.length > 0 ? (
                    <div className="space-y-3">
                        {accounts.map((account) => (
                            <SocialAccountCard
                                key={account.id}
                                account={account}
                                onUnlink={handleUnlink}
                                isUnlinking={unlinkingId === account.id}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 border border-dashed border-white/10 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">{t('noConnectedAccounts') || 'No social accounts connected yet'}</p>
                    </div>
                )}

                {/* Platform connect buttons */}
                <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-3">{t('connectNewAccount') || 'Connect a new account'}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
                            const Icon = config.icon;
                            const alreadyConnected = accounts.some(a => a.platform === key);
                            return (
                                <Button
                                    key={key}
                                    variant="outline"
                                    size="sm"
                                    className={`border-white/10 gap-2 ${alreadyConnected ? 'opacity-50' : 'hover:bg-white/5'}`}
                                    onClick={() => {
                                        setConnectPlatform(key);
                                        setIsModalOpen(true);
                                    }}
                                    disabled={alreadyConnected}
                                >
                                    <Icon className="h-4 w-4" />
                                    {alreadyConnected ? `${config.label} ✓` : config.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Account Connect Modal */}
            <AccountConnectModal
                platform={connectPlatform}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConnectOAuth={handleConnectOAuth}
                onConnectCredentials={handleConnectCredentials}
                onConnectApiKey={handleConnectApiKey}
                isConnecting={isConnecting}
                t={t}
            />
        </div>
    );
}
