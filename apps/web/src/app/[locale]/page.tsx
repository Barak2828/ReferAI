"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { motion } from "framer-motion";
import { ArrowRight, Zap, BarChart3, Globe2, Sparkles } from "lucide-react";

export default function Home() {
    const t = useTranslations('Index');
    const locale = useLocale();

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const features = [
        {
            icon: Zap,
            title: t('features.ai'),
            description: t('features.aiDesc'),
            color: "from-blue-500 to-blue-600",
            glow: "glow-blue",
        },
        {
            icon: BarChart3,
            title: t('features.track'),
            description: t('features.trackDesc'),
            color: "from-purple-500 to-purple-600",
            glow: "glow-indigo",
        },
        {
            icon: Globe2,
            title: t('features.paid'),
            description: t('features.paidDesc'),
            color: "from-indigo-500 to-indigo-600",
            glow: "glow-indigo",
        },
    ];

    return (
        <main className="min-h-screen bg-background overflow-hidden">
            {/* Hero Section */}
            <div className="relative pt-20 pb-32 lg:pt-32 overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 dot-pattern opacity-40" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-blob" />
                    <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
                    <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[120px] animate-blob animation-delay-4000" />
                </div>

                <div className="container relative z-10 mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center rounded-full glass px-4 py-1.5 text-sm text-blue-300 mb-8"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse" />
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        {t('poweredBy')}
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6"
                    >
                        {t('title')}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto mb-10"
                    >
                        {t('subtitle')} {t('subtitleExtended')}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex items-center justify-center gap-x-6"
                    >
                        <Link href={`/${locale}/signup`}>
                            <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 hover:shadow-blue-600/30">
                                {t('getStarted')} <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href={`/${locale}/login`}>
                            <Button variant="ghost" size="lg" className="rounded-full px-8 py-6 text-lg text-muted-foreground hover:text-foreground">
                                {t('signIn')} <span aria-hidden="true" className="ml-1">&#8594;</span>
                            </Button>
                        </Link>
                        <Link href="#features">
                            <Button variant="ghost" size="lg" className="rounded-full px-8 py-6 text-lg text-muted-foreground hover:text-foreground">
                                {t('learnMore')} <span aria-hidden="true" className="ml-1">&#8594;</span>
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="py-24 sm:py-32 relative">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center mb-16">
                        <h2 className="text-base font-semibold leading-7 text-primary">{t('deployFaster')}</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            {t('everythingYouNeed')}
                        </p>
                    </div>

                    <motion.div
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none"
                    >
                        <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3">
                            {features.map((feature) => (
                                <motion.div key={feature.title} variants={item}>
                                    <div className={`glass rounded-xl p-6 hover:translate-y-[-5px] transition-all duration-300 gradient-border hover:${feature.glow}`}>
                                        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}>
                                            <feature.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                                        <p className="text-muted-foreground">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
