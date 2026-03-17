"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { X, Loader2, Instagram, Eye, EyeOff } from "lucide-react";

interface AccountConnectModalProps {
    platform: string;
    isOpen: boolean;
    onClose: () => void;
    onConnectOAuth: (platform: string) => void;
    onConnectCredentials: (platform: string, username: string, password: string) => void;
    onConnectApiKey: (apiToken: string, phoneNumberId: string, businessName: string) => void;
    isConnecting: boolean;
    t: (key: string) => string;
}

const platformLabels: Record<string, string> = {
    INSTAGRAM: 'Instagram',
    INSTAGRAM_OAUTH: 'Instagram Business',
    FACEBOOK: 'Facebook Page',
    GOOGLE_BUSINESS: 'Google Business',
    YOUTUBE: 'YouTube',
    WHATSAPP: 'WhatsApp Business',
};

export function AccountConnectModal({
    platform,
    isOpen,
    onClose,
    onConnectOAuth,
    onConnectCredentials,
    onConnectApiKey,
    isConnecting,
    t,
}: AccountConnectModalProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [igMode, setIgMode] = useState<'business' | 'personal'>('business');

    // WhatsApp fields
    const [waApiToken, setWaApiToken] = useState("");
    const [waPhoneId, setWaPhoneId] = useState("");
    const [waBusinessName, setWaBusinessName] = useState("");

    if (!isOpen) return null;

    const isOAuth = ['FACEBOOK', 'GOOGLE_BUSINESS', 'YOUTUBE'].includes(platform);
    const isApiKey = platform === 'WHATSAPP';
    const isInstagram = platform === 'INSTAGRAM';

    const handleSubmit = () => {
        if (isOAuth) {
            onConnectOAuth(platform);
        } else if (isInstagram) {
            if (igMode === 'business') {
                onConnectOAuth('INSTAGRAM');
            } else {
                onConnectCredentials(platform, username, password);
            }
        } else if (isApiKey) {
            onConnectApiKey(waApiToken, waPhoneId, waBusinessName);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative glass rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 end-4 text-muted-foreground hover:text-foreground transition"
                >
                    <X className="h-5 w-5" />
                </button>

                <h3 className="text-lg font-semibold text-foreground mb-1">
                    {platformLabels[platform] || platform}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                    {t('publishConnectFirst')}
                </p>

                {/* OAuth platforms — just a connect button */}
                {isOAuth && (
                    <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                        onClick={handleSubmit}
                        disabled={isConnecting}
                    >
                        {isConnecting ? (
                            <>
                                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                {t('oauthConnecting')}
                            </>
                        ) : (
                            `Connect ${platformLabels[platform]}`
                        )}
                    </Button>
                )}

                {/* Instagram — dual mode: Business (OAuth) or Personal (Riona) */}
                {isInstagram && (
                    <div className="space-y-4">
                        {/* Mode toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIgMode('business')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                    igMode === 'business'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                                        : 'bg-navy-800/50 text-muted-foreground border border-white/10 hover:border-white/20'
                                }`}
                            >
                                {t('igBusinessAccount') || 'Business Account'}
                            </button>
                            <button
                                onClick={() => setIgMode('personal')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                    igMode === 'personal'
                                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                                        : 'bg-navy-800/50 text-muted-foreground border border-white/10 hover:border-white/20'
                                }`}
                            >
                                {t('igPersonalAccount') || 'Personal Account'}
                            </button>
                        </div>

                        {igMode === 'business' ? (
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    {t('igBusinessDesc') || 'Connect via Facebook for post/reel publishing. Requires an Instagram Business or Creator account linked to a Facebook Page.'}
                                </p>
                                <Button
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                                    onClick={handleSubmit}
                                    disabled={isConnecting}
                                >
                                    {isConnecting ? (
                                        <>
                                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                            {t('oauthConnecting')}
                                        </>
                                    ) : (
                                        <>
                                            <Instagram className="me-2 h-4 w-4" />
                                            {t('igConnectViaFacebook') || 'Connect via Facebook'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    {t('igPersonalDesc') || 'Connect with username/password for DM automation via Riona.'}
                                </p>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">{t('socialUsernamePlaceholder')}</label>
                                    <Input
                                        placeholder="@username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="bg-navy-800/50 border-white/10"
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">{t('socialPasswordPlaceholder')}</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="bg-navy-800/50 border-white/10 pe-10"
                                            dir="ltr"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Button
                                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white"
                                    onClick={handleSubmit}
                                    disabled={isConnecting || !username || !password}
                                >
                                    {isConnecting ? (
                                        <>
                                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                            {t('socialIgLoggingIn')}
                                        </>
                                    ) : (
                                        <>
                                            <Instagram className="me-2 h-4 w-4" />
                                            {t('connectInstagram')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* WhatsApp — API key form */}
                {isApiKey && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('whatsappApiToken')}</label>
                            <Input
                                placeholder="EAAx..."
                                value={waApiToken}
                                onChange={(e) => setWaApiToken(e.target.value)}
                                className="bg-navy-800/50 border-white/10"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('whatsappPhoneId')}</label>
                            <Input
                                placeholder="1234567890"
                                value={waPhoneId}
                                onChange={(e) => setWaPhoneId(e.target.value)}
                                className="bg-navy-800/50 border-white/10"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">{t('whatsappBusinessName')}</label>
                            <Input
                                placeholder="My Business"
                                value={waBusinessName}
                                onChange={(e) => setWaBusinessName(e.target.value)}
                                className="bg-navy-800/50 border-white/10"
                            />
                        </div>
                        <Button
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white"
                            onClick={handleSubmit}
                            disabled={isConnecting || !waApiToken || !waPhoneId || !waBusinessName}
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                                    {t('whatsappConnecting')}
                                </>
                            ) : (
                                t('whatsappConnectButton')
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
