"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, BarChart3, Globe2 } from "lucide-react";

export default function Home() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <main className="min-h-screen bg-slate-50 overflow-hidden">
            {/* Hero Section */}
            <div className="relative pt-20 pb-32 lg:pt-32 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply animate-blob" />
                    <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" />
                    <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-pink-400/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000" />
                </div>

                <div className="container relative z-10 mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800 mb-8 backdrop-blur-sm"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
                        Azuga-Powered Israel Pilot 🇮🇱
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6"
                    >
                        Turn Your Network <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                            Into Revenue
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto mb-10"
                    >
                        The first AI-powered social referral platform designed for the Israeli market.
                        Automate your content, track every lead, and get paid instantly.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex items-center justify-center gap-x-6"
                    >
                        <Link href="/login">
                            <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:scale-105">
                                Get Started <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="#features">
                            <Button variant="ghost" size="lg" className="rounded-full px-8 py-6 text-lg text-slate-600 hover:text-slate-900">
                                Learn more <span aria-hidden="true">→</span>
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="py-24 sm:py-32 bg-white/50 backdrop-blur-3xl relative">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center mb-16">
                        <h2 className="text-base font-semibold leading-7 text-blue-600">Deploy Faster</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            Everything you need to scale your referrals
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
                            <motion.div variants={item}>
                                <Card className="border-0 shadow-xl shadow-blue-900/5 bg-white/80 backdrop-blur-sm hover:translate-y-[-5px] transition-all duration-300">
                                    <CardHeader>
                                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                                            <Zap className="h-6 w-6" />
                                        </div>
                                        <CardTitle className="text-xl">AI Content Engine</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-slate-600">
                                        Generate high-converting Hebrew/English posts for WhatsApp, Instagram, and LinkedIn in seconds.
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div variants={item}>
                                <Card className="border-0 shadow-xl shadow-purple-900/5 bg-white/80 backdrop-blur-sm hover:translate-y-[-5px] transition-all duration-300">
                                    <CardHeader>
                                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/20">
                                            <BarChart3 className="h-6 w-6" />
                                        </div>
                                        <CardTitle className="text-xl">Smart Tracking</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-slate-600">
                                        Real-time analytics for every click, lead, and closed deal. Know exactly what your network is worth.
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div variants={item}>
                                <Card className="border-0 shadow-xl shadow-indigo-900/5 bg-white/80 backdrop-blur-sm hover:translate-y-[-5px] transition-all duration-300">
                                    <CardHeader>
                                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                                            <Globe2 className="h-6 w-6" />
                                        </div>
                                        <CardTitle className="text-xl">Global & Local</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-slate-600">
                                        Built for the Israeli market with full RTL support, multi-currency, and local payment integrations.
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
