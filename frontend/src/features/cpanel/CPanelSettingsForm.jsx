import React, { useState } from "react";
import { Eye, EyeOff, Save, CheckCircle2, Server } from "lucide-react";
import { Button } from "../../components/ui/Button";

export function CPanelSettingsForm({ onSuccess }) {
    const [formData, setFormData] = useState({
        hostUrl: "",
        username: "",
        apiToken: ""
    });
    const [showToken, setShowToken] = useState(false);
    const [status, setStatus] = useState("idle");

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus("saving");

        // Simulate API call/Storage
        setTimeout(() => {
            console.log("Saving cPanel Credentials:", formData);
            setStatus("saved");
            if (onSuccess) onSuccess();
            setTimeout(() => setStatus("idle"), 2000);
        }, 800);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                    <Server className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Connection Details</h2>
                    <p className="text-sm text-gray-500">Configure your cPanel server access</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Host URL */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">cPanel URL</label>
                    <input
                        type="url"
                        placeholder="https://cpanel.yourdomain.com:2083"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium"
                        value={formData.hostUrl}
                        onChange={(e) => setFormData({ ...formData, hostUrl: e.target.value })}
                        required
                    />
                </div>

                {/* Username */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Username</label>
                    <input
                        type="text"
                        placeholder="cpanel_user"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                </div>

                {/* API Token / Password */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">API Token / Password</label>
                    <div className="relative">
                        <input
                            type={showToken ? "text" : "password"}
                            placeholder="••••••••••••••••"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium pr-12"
                            value={formData.apiToken}
                            onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                        >
                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <Button
                    type="submit"
                    disabled={status === 'saving'}
                    className={`
                      h-11 px-8 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all
                      ${status === 'saved' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'}
                    `}
                >
                    {status === 'saving' ? (
                        <span className="flex items-center gap-2">Saving...</span>
                    ) : status === 'saved' ? (
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Saved</span>
                    ) : (
                        <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Credentials</span>
                    )}
                </Button>
            </div>
        </form>
    );
}
