"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SocialAccountCard } from "@/components/ui/social-account-card";
import { RionaStatusBadge } from "@/components/ui/riona-status-badge";
import { useToast } from "@/components/ui/toast";
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { updateProfile } from "@/app/actions/profile";
import { getLinkedAccounts, linkSocialAccount, unlinkSocialAccount, getRionaStatus } from "@/app/actions/social";
import { User, Instagram, Plus, Loader2 } from "lucide-react";
import type { SocialAccount } from "@/lib/riona/types";

export default function ProfilePage() {
    const t = useTranslations('Dashboard');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [rionaConnected, setRionaConnected] = useState(false);
    const [showLinkForm, setShowLinkForm] = useState(false);
    const [linkUsername, setLinkUsername] = useState("");
    const [linkPassword, setLinkPassword] = useState("");
    const [isLinking, setIsLinking] = useState(false);
    const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

    useEffect(() => {
        getRionaStatus().then((status) => {
            setRionaConnected(status.serverReachable);
        });
    }, []);

    async function handleSubmit(formData: FormData) {
        const newLocale = formData.get('locale') as string;
        const result = await updateProfile(formData);
        if (result?.error) {
            toast({ title: t('toastError'), description: result.error, variant: 'error' });
        } else {
            toast({ title: t('toastProfileUpdated'), description: t('toastProfileUpdatedDesc'), variant: 'success' });

            // If locale changed, redirect to the new locale path
            if (newLocale && newLocale !== locale) {
                const newPath = pathname.replace(`/${locale}/`, `/${newLocale}/`);
                router.push(newPath);
            }
        }
    }

    async function handleLinkAccount() {
        if (!linkUsername || !linkPassword) return;
        setIsLinking(true);
        try {
            const result = await linkSocialAccount('demo-user', 'INSTAGRAM', linkUsername, linkPassword);
            if (result.success && result.account) {
                setAccounts(prev => [...prev, result.account!]);
                setShowLinkForm(false);
                setLinkUsername("");
                setLinkPassword("");
                toast({ title: t('socialAccountLinked'), variant: 'success' });
            } else {
                toast({ title: t('toastError'), description: result.error, variant: 'error' });
            }
        } catch {
            toast({ title: t('toastError'), description: t('toastUnexpectedError'), variant: 'error' });
        } finally {
            setIsLinking(false);
        }
    }

    async function handleUnlink(accountId: string) {
        setUnlinkingId(accountId);
        try {
            const result = await unlinkSocialAccount(accountId, 'demo-user');
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
        <div className="max-w-md mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-foreground">{t('profileSettings')}</h1>

            <div className="glass rounded-xl p-6 space-y-6">
                {/* Avatar placeholder */}
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <User className="h-10 w-10 text-white" />
                    </div>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">{t('fullName')}</label>
                        <Input name="name" placeholder={t('fullNamePlaceholder')} required className="bg-navy-800/50 border-white/10" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">{t('role')}</label>
                        <Select name="role" className="bg-navy-800/50 border-white/10">
                            <option value="PROVIDER">{t('roleProvider')}</option>
                            <option value="PROMOTER">{t('rolePromoter')}</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">{t('language')}</label>
                        <Select name="locale" className="bg-navy-800/50 border-white/10">
                            <option value="he">{t('hebrewLanguage')}</option>
                            <option value="en">{t('englishLanguage')}</option>
                        </Select>
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white">
                        {t('saveChanges')}
                    </Button>
                </form>

                {/* Connected AI Providers */}
                <div className="pt-4 border-t border-white/5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('connectedAIEngines')}</h3>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-xs">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-emerald-300">OpenAI</span>
                        </div>
                        <div className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-xs">
                            <span className="h-2 w-2 rounded-full bg-orange-400" />
                            <span className="text-orange-300">Anthropic</span>
                        </div>
                    </div>
                </div>

                {/* Connected Social Accounts */}
                <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-muted-foreground">{t('socialConnectedAccounts')}</h3>
                        <RionaStatusBadge connected={rionaConnected} />
                    </div>

                    {accounts.length > 0 && (
                        <div className="space-y-2 mb-3">
                            {accounts.map((account) => (
                                <SocialAccountCard
                                    key={account.id}
                                    account={account}
                                    onUnlink={handleUnlink}
                                    isUnlinking={unlinkingId === account.id}
                                />
                            ))}
                        </div>
                    )}

                    {showLinkForm ? (
                        <div className="glass rounded-lg p-4 space-y-3 border border-pink-500/20">
                            <div className="flex items-center gap-2 mb-1">
                                <Instagram className="h-4 w-4 text-pink-400" />
                                <span className="text-sm font-medium text-foreground">{t('socialLinkInstagram')}</span>
                            </div>
                            <Input
                                placeholder={t('socialUsernamePlaceholder')}
                                value={linkUsername}
                                onChange={(e) => setLinkUsername(e.target.value)}
                                className="bg-navy-800/50 border-white/10"
                            />
                            <Input
                                type="password"
                                placeholder={t('socialPasswordPlaceholder')}
                                value={linkPassword}
                                onChange={(e) => setLinkPassword(e.target.value)}
                                className="bg-navy-800/50 border-white/10"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleLinkAccount}
                                    disabled={isLinking || !linkUsername || !linkPassword}
                                    className="bg-pink-600 hover:bg-pink-500 text-white"
                                >
                                    {isLinking && <Loader2 className="me-2 h-3 w-3 animate-spin" />}
                                    {t('socialLinkButton')}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowLinkForm(false)}>
                                    {t('backButton')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-white/10 gap-2"
                            onClick={() => setShowLinkForm(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {t('socialAddAccount')}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
