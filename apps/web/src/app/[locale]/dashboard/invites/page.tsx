"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
    Mail, Check, X, Users, DollarSign, Clock, Star,
    TrendingUp, ExternalLink, Loader2,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

type InviteStatus = 'pending' | 'accepted' | 'declined';

interface CollaborationInvite {
    id: string;
    campaignName: string;
    brandName: string;
    brandAvatar: string;
    description: string;
    followers: string;
    price: string;
    status: InviteStatus;
    sentAt: string;
    tags: string[];
}

// Demo invites data matching Stitch design
const DEMO_INVITES: CollaborationInvite[] = [
    {
        id: '1',
        campaignName: 'Sustainable Living 2024',
        brandName: 'Julianna Shukut',
        brandAvatar: 'JS',
        description: 'Creating high-quality content for a sustainable-friendly urban consumer audience and startup ecosystem using eco-conscious strategies.',
        followers: '50k+',
        price: '$150.00',
        status: 'pending',
        sentAt: '2024-03-20',
        tags: ['Sustainability', 'Lifestyle'],
    },
    {
        id: '2',
        campaignName: 'Architectural Services',
        brandName: 'Mirasa Thema',
        brandAvatar: 'MT',
        description: 'Promotion for a contemporary residence in urban settings that combines sustainable architecture in a sophisticated complex.',
        followers: '12k',
        price: '$2,400',
        status: 'pending',
        sentAt: '2024-03-18',
        tags: ['Architecture', 'Design'],
    },
    {
        id: '3',
        campaignName: 'Urban Flux: 2025',
        brandName: 'StudioMetric',
        brandAvatar: 'SM',
        description: 'Seeking creative collaborators to amplify authentic stories and create voice-driven social content.',
        followers: '25k',
        price: '$895',
        status: 'pending',
        sentAt: '2024-03-15',
        tags: ['Urban', 'Creative'],
    },
    {
        id: '4',
        campaignName: 'Neo-Minimalism Series',
        brandName: 'Elara Basel',
        brandAvatar: 'EB',
        description: 'Collaborate on an exclusive series exploring the intersection of minimalist photography with contemporary art and NFT opportunities.',
        followers: '8k',
        price: '$500',
        status: 'accepted',
        sentAt: '2024-03-10',
        tags: ['Art', 'Photography'],
    },
    {
        id: '5',
        campaignName: 'Lighting the Shadows',
        brandName: 'David Chen',
        brandAvatar: 'DC',
        description: 'A collaboration photo-series about shadows as natural light casts available-form compositions.',
        followers: '6k',
        price: '$300',
        status: 'declined',
        sentAt: '2024-03-08',
        tags: ['Photography', 'Art'],
    },
];

export default function InvitesPage() {
    const t = useTranslations('Dashboard');
    const locale = useLocale();
    const { toast } = useToast();

    const [invites, setInvites] = useState<CollaborationInvite[]>(DEMO_INVITES);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const filteredInvites = activeTab === 'all'
        ? invites
        : invites.filter(i => i.status === activeTab);

    const pendingCount = invites.filter(i => i.status === 'pending').length;
    const acceptedCount = invites.filter(i => i.status === 'accepted').length;

    async function handleAccept(id: string) {
        setProcessingId(id);
        await new Promise(r => setTimeout(r, 800));
        setInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'accepted' as InviteStatus } : i));
        toast({ title: 'Invite Accepted', description: 'You can now start collaborating', variant: 'success' });
        setProcessingId(null);
    }

    async function handleDecline(id: string) {
        setProcessingId(id);
        await new Promise(r => setTimeout(r, 500));
        setInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'declined' as InviteStatus } : i));
        toast({ title: 'Invite Declined', variant: 'info' });
        setProcessingId(null);
    }

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    // Featured campaign (highest price accepted invite)
    const featured = invites.find(i => i.status === 'accepted');

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Collaboration Invites</h1>
                <p className="text-muted-foreground mt-1">
                    Review and manage exclusive campaign requests from your network.
                </p>
            </div>

            {/* Tab Filter */}
            <motion.div variants={item} className="flex gap-1 p-1 glass rounded-xl">
                {[
                    { key: 'all' as const, label: 'All', count: invites.length },
                    { key: 'pending' as const, label: 'Pending', count: pendingCount },
                    { key: 'accepted' as const, label: 'Active', count: acceptedCount },
                    { key: 'declined' as const, label: 'Archived', count: invites.filter(i => i.status === 'declined').length },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                            activeTab === tab.key
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'text-muted-foreground hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        {tab.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-primary/30' : 'bg-white/10'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </motion.div>

            {/* Featured Campaign (if accepted invite exists) */}
            {featured && activeTab !== 'declined' && (
                <motion.div variants={item}>
                    <div className="glass rounded-xl p-6 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent">
                        <div className="flex items-center gap-2 mb-3">
                            <Star className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Featured Collaboration</span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-1">{featured.campaignName}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{featured.description}</p>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-400" />
                                <span className="text-2xl font-bold text-foreground">{featured.price}</span>
                                <span className="text-xs text-emerald-400">+15%</span>
                            </div>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                                View Full Campaign Brief
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Invite Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {filteredInvites.map((invite) => (
                    <motion.div key={invite.id} variants={item}>
                        <div className={`glass rounded-xl p-5 border transition-all hover:border-white/20 ${
                            invite.status === 'accepted' ? 'border-emerald-500/20' :
                            invite.status === 'declined' ? 'border-white/5 opacity-60' :
                            'border-white/10'
                        }`}>
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                        {invite.brandAvatar}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">{invite.brandName}</p>
                                        <p className="text-xs text-muted-foreground">{invite.tags.join(' · ')}</p>
                                    </div>
                                </div>
                                <Badge variant={
                                    invite.status === 'accepted' ? 'success' :
                                    invite.status === 'declined' ? 'default' :
                                    'outline'
                                } className="text-[10px]">
                                    {invite.status === 'pending' ? 'Pending' :
                                     invite.status === 'accepted' ? 'Active' : 'Declined'}
                                </Badge>
                            </div>

                            {/* Campaign Name */}
                            <h3 className="font-semibold text-foreground mb-2">{invite.campaignName}</h3>

                            {/* Metrics Row */}
                            <div className="flex items-center gap-4 mb-3">
                                <div className="flex items-center gap-1.5 text-sm">
                                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-foreground font-medium">{invite.followers}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-emerald-400 font-medium">{invite.price}</span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{invite.description}</p>

                            {/* Actions */}
                            {invite.status === 'pending' && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white"
                                        onClick={() => handleAccept(invite.id)}
                                        disabled={processingId === invite.id}
                                    >
                                        {processingId === invite.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <><Check className="me-1 h-3 w-3" /> Accept</>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-white/10"
                                        onClick={() => handleDecline(invite.id)}
                                        disabled={processingId === invite.id}
                                    >
                                        Decline
                                    </Button>
                                </div>
                            )}
                            {invite.status === 'accepted' && (
                                <Button variant="outline" size="sm" className="w-full border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
                                    <ExternalLink className="me-1 h-3 w-3" /> View Campaign
                                </Button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredInvites.length === 0 && (
                <div className="text-center py-16 glass rounded-xl border border-dashed border-white/10">
                    <Mail className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No invites in this category</p>
                </div>
            )}

            {/* Stats Footer */}
            <motion.div variants={item} className="glass rounded-xl p-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    Showing {filteredInvites.length} of {invites.length} pending invitations
                </span>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-yellow-400" />
                        <span className="text-foreground">{pendingCount} pending</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-foreground">{acceptedCount} active</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
