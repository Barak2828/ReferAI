"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: 'Provider', href: '/dashboard/provider', icon: LayoutDashboard },
        { name: 'Promoter', href: '/dashboard/promoter', icon: Users },
        { name: 'Profile', href: '/dashboard/profile', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar (Desktop) */}
            <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
                <div className="flex flex-col flex-grow border-r border-slate-200 bg-white/70 backdrop-blur-xl">
                    <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-slate-100">
                        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ReferAI
                        </Link>
                    </div>
                    <nav className="flex-1 flex flex-col px-4 py-6 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname?.includes(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                        isActive
                                            ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                        )}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="p-4 border-t border-slate-100">
                        <Link href="/login">
                            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                                <LogOut className="mr-3 h-5 w-5" />
                                Logout
                            </Button>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold text-slate-900">ReferAI</Link>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:pl-64 pt-16 lg:pt-0">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
