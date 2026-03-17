"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: number; label: string };
    accentColor?: 'blue' | 'purple' | 'green' | 'indigo';
}

const glowColors = {
    blue: 'glow-blue',
    purple: 'glow-indigo',
    green: 'glow-green',
    indigo: 'glow-indigo',
};

const iconBg = {
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    indigo: 'bg-indigo-500/10 text-indigo-400',
};

export function StatsCard({ title, value, icon, trend, accentColor = 'blue' }: StatsCardProps) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className={cn(
                "glass rounded-xl p-6 transition-all duration-300 hover:border-white/10",
                `hover:${glowColors[accentColor]}`
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", iconBg[accentColor])}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold text-foreground">{value}</div>
            {trend && (
                <p className={cn(
                    "text-xs mt-2 flex items-center",
                    trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                    {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
                </p>
            )}
        </motion.div>
    );
}
