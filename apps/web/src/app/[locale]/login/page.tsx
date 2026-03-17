"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { login, signInWithOAuth } from "@/app/actions/auth";
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations('Auth');
    const locale = useLocale();

    async function handleSubmit(formData: FormData) {
        formData.set('locale', locale);
        const result = await login(formData);
        if (result?.error) {
            setError(result.error);
        }
    }

    return (
        <div className="flex min-h-screen">
            {/* Left side - Brand */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20" />
                <div className="absolute inset-0 dot-pattern opacity-30" />
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px] animate-blob" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-600/15 rounded-full blur-[100px] animate-blob animation-delay-2000" />

                <div className="relative z-10 flex flex-col justify-center px-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Link href={`/${locale}`} className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-8 block">
                            ReferAI
                        </Link>
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            {t('brandTitle')}
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-md">
                            {t('brandSubtitle')}
                        </p>
                        <div className="mt-8 flex items-center gap-3">
                            <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs text-blue-300">
                                <Sparkles className="h-3 w-3" />
                                {t('poweredByOpenAI')}
                            </div>
                            <div className="flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs text-orange-300">
                                <Sparkles className="h-3 w-3" />
                                {t('poweredByAnthropic')}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right side - Login form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="glass-strong rounded-2xl p-8 space-y-6">
                        <div className="text-center">
                            <Link href={`/${locale}`} className="lg:hidden text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4 block">
                                ReferAI
                            </Link>
                            <h1 className="text-2xl font-bold text-foreground">{t('welcome')}</h1>
                            <p className="text-sm text-muted-foreground mt-1">{t('signInSubtitle')}</p>
                        </div>

                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-3">
                                <Input
                                    name="email"
                                    type="email"
                                    placeholder={t('email')}
                                    required
                                    className="bg-navy-800/50 border-white/10 focus:border-primary"
                                />
                                <Input
                                    name="password"
                                    type="password"
                                    placeholder={t('password')}
                                    required
                                    className="bg-navy-800/50 border-white/10 focus:border-primary"
                                />
                            </div>
                            {error && <p className="text-sm text-red-400">{error}</p>}
                            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white">
                                {t('signIn')}
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-navy-800 px-2 text-muted-foreground">{t('orContinueWith')}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={async () => {
                                const result = await signInWithOAuth('google', locale);
                                if (result?.url) {
                                    window.location.href = result.url;
                                } else if (result?.error) {
                                    setError(result.error);
                                }
                            }} className="border-white/10 bg-navy-800/50 hover:bg-navy-700/50">
                                {t('google')}
                            </Button>
                            <Button variant="outline" onClick={async () => {
                                const result = await signInWithOAuth('facebook', locale);
                                if (result?.url) {
                                    window.location.href = result.url;
                                } else if (result?.error) {
                                    setError(result.error);
                                }
                            }} className="border-white/10 bg-navy-800/50 hover:bg-navy-700/50">
                                {t('meta')}
                            </Button>
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            {t('noAccount')}{' '}
                            <Link href={`/${locale}/signup`} className="text-primary hover:underline font-medium">
                                {t('signUp')}
                            </Link>
                        </p>

                        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
                            <div className="text-center text-xs text-muted-foreground space-y-1">
                                <Link href={`/${locale}/dashboard/provider`} className="text-primary/70 hover:text-primary hover:underline block">
                                    {t('demoProvider')}
                                </Link>
                                <Link href={`/${locale}/dashboard/promoter`} className="text-primary/70 hover:text-primary hover:underline block">
                                    {t('demoPromoter')}
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
