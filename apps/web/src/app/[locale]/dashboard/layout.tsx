"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LayoutDashboard, Users, Settings, LogOut, Menu, X, Megaphone, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "@/app/actions/auth";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations('Dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: t('navProvider'), href: `/${locale}/dashboard/provider`, icon: LayoutDashboard },
        { name: t('navPromoter'), href: `/${locale}/dashboard/promoter`, icon: Users },
        { name: t('navNewCampaign'), href: `/${locale}/dashboard/provider/campaigns/new`, icon: Megaphone },
        { name: t('navAnalytics'), href: `/${locale}/dashboard/provider/analytics`, icon: BarChart3 },
        { name: t('navProfile'), href: `/${locale}/dashboard/profile`, icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar (Desktop) */}
            <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 start-0 z-50">
                <div className="flex flex-col flex-grow glass-strong border-e border-white/5">
                    <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-white/5">
                        <Link href={`/${locale}`} className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            ReferAI
                        </Link>
                        <span className="ms-2 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <nav className="flex-1 flex flex-col px-3 py-6 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname?.includes(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute start-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-blue-400 to-indigo-400 rounded-full" />
                                    )}
                                    <item.icon
                                        className={cn(
                                            "me-3 h-5 w-5 flex-shrink-0 transition-colors",
                                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="p-3 border-t border-white/5">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => signOut(locale)}
                        >
                            <LogOut className="me-3 h-5 w-5" />
                            {t('logout')}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5 px-4 h-16 flex items-center justify-between">
                <Link href={`/${locale}`} className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    ReferAI
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", damping: 25 }}
                            className="w-64 h-full glass-strong border-r border-white/5 p-4 pt-20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <nav className="space-y-1">
                                {navigation.map((item) => {
                                    const isActive = pathname?.includes(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:bg-white/5"
                                            )}
                                        >
                                            <item.icon className="me-3 h-5 w-5" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 lg:ps-64 pt-16 lg:pt-0">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
