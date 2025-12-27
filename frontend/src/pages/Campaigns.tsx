import React, { useEffect, useState } from 'react';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import { Plus, Calendar, Layers, MoreHorizontal } from 'lucide-react';

const API_URL = "http://localhost:8000/api";

interface Campaign {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: string;
}

const Campaigns = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState("");


    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');

    const fetchCampaigns = async () => {
        if (!user.email) return;
        try {
            const res = await fetch(`${API_URL}/campaigns/${user.email}`);
            const data = await res.json();
            if (data.success) {
                setCampaigns(data.campaigns);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleCreate = async () => {
        if (!newCampaignName) return;
        try {
            const res = await fetch(`${API_URL}/campaigns/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.email,
                    name: newCampaignName,
                    description: "Created via Dashboard"
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsCreating(false);
                setNewCampaignName("");
                fetchCampaigns();
            }
        } catch (e) {
            alert("Error creating campaign");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Campaigns</h1>
                    <p className="text-gray-400">Manage your content calendar and marketing pushes.</p>
                </div>
                <Button onClick={() => setIsCreating(true)} disabled={loading}>
                    <Plus className="w-5 h-5 mr-2" />
                    New Campaign
                </Button>
            </div>

            {isCreating && (
                <GlassCard className="max-w-md mx-auto mb-8 border-primary/30">
                    <h3 className="text-lg font-semibold text-white mb-4">Create Campaign</h3>
                    <input
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white mb-4 focus:ring-2 focus:ring-primary/50 outline-none"
                        placeholder="Campaign Name (e.g. Q4 Launch)"
                        value={newCampaignName}
                        onChange={(e) => setNewCampaignName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsCreating(false)} disabled={false}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!newCampaignName}>Create</Button>
                    </div>
                </GlassCard>
            )}

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading campaigns...</div>
            ) : campaigns.length === 0 && !isCreating ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                    <Layers className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No Active Campaigns</h3>
                    <p className="text-gray-400 mb-6">Start organizing your content into campaigns.</p>
                    <Button variant="secondary" onClick={() => setIsCreating(true)} disabled={loading}>Create First Campaign</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map((camp) => (
                        <GlassCard key={camp.id} hoverEffect className="group flex flex-col h-full cursor-pointer hover:border-primary/30">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 text-emerald-400">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${camp.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
                                    {camp.status}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{camp.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">{camp.description || "No description"}</p>

                            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-gray-500 text-sm">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(camp.created_at).toLocaleDateString()}
                                </span>
                                <MoreHorizontal className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Campaigns;
