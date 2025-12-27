import React, { useState } from "react";
import { X, Server, Eye, EyeOff, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";

export function CPanelManager({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        hostUrl: "",
        username: "",
        apiToken: ""
    });
    const [showToken, setShowToken] = useState(false);
    const [status, setStatus] = useState("idle"); // idle, saving, saved, error

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus("saving");

        // Simulate API call/Storage
        setTimeout(() => {
            console.log("Saving cPanel Credentials:", formData);
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 2000);
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-white/20 overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                            <Server className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">cPanel Connection</h2>
                            <p className="text-sm text-gray-500">Manage your server credentials</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-5">

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
                            <p className="text-[11px] text-gray-400 ml-1">
                                Your credentials are stored locally and only used for direct API calls.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <Button
                                type="submit"
                                disabled={status === 'saving'}
                                className={`
                  h-11 px-6 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all
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
                </div>
            </div>
        </div>
    );
}
