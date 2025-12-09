"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, TrendingUp, Users, Wallet, ArrowUpRight, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { syncAzugaCampaigns } from "@/app/actions/azuga";

export default function ProviderDashboard() {
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncAzugaCampaigns();
        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            setIsSyncing(false);
        }
    };

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
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Provider Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage your campaigns and track performance</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-white hover:bg-slate-50 border-slate-200"
                    >
                        {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Sync from Azuga CRM
                    </Button>
                    <Link href="/dashboard/provider/campaigns/new">
                        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-full px-6">
                            <Plus className="mr-2 h-4 w-4" /> Create Campaign
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <motion.div variants={item}>
                    <Card className="border-0 shadow-lg shadow-blue-900/5 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Total Leads</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">12</div>
                            <p className="text-xs text-green-600 flex items-center mt-1">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                +18% from last week
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="border-0 shadow-lg shadow-purple-900/5 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Active Promoters</CardTitle>
                            <Users className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">5</div>
                            <p className="text-xs text-slate-500 mt-1">Active across 2 campaigns</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="border-0 shadow-lg shadow-indigo-900/5 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Pending Commissions</CardTitle>
                            <Wallet className="h-4 w-4 text-indigo-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">₪ 450</div>
                            <p className="text-xs text-slate-500 mt-1">Next payout: Dec 1st</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <motion.div variants={item}>
                <h2 className="text-xl font-semibold mb-4 text-slate-900">Active Campaigns</h2>
                <Card className="border-0 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl overflow-hidden">
                    <CardContent className="p-0">
                        <div className="border-b border-slate-100 bg-slate-50/50 p-4 grid grid-cols-4 font-medium text-sm text-slate-500">
                            <div>Campaign Name</div>
                            <div>Status</div>
                            <div>Leads</div>
                            <div>Actions</div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            <div className="p-4 grid grid-cols-4 items-center text-sm hover:bg-slate-50/50 transition-colors">
                                <div className="font-medium text-slate-900">Summer Sale 2025</div>
                                <div>
                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                        Active
                                    </span>
                                </div>
                                <div className="text-slate-600">8</div>
                                <div>
                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        View Details <ArrowRight className="ml-2 h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
