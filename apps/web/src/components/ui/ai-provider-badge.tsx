import { cn } from "@/lib/utils";
import type { AIProvider } from "@/types";

interface AIProviderBadgeProps {
    provider: AIProvider;
    className?: string;
}

const providerConfig = {
    openai: {
        label: 'OpenAI',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    anthropic: {
        label: 'Anthropic',
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    },
};

export function AIProviderBadge({ provider, className }: AIProviderBadgeProps) {
    const config = providerConfig[provider];
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            config.color,
            className
        )}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {config.label}
        </span>
    );
}
