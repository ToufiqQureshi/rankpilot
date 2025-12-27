import React from "react";
import { X, Settings, Moon, Sun, Monitor, User, Shield } from "lucide-react";
import { useTheme } from "../../components/providers/theme-provider";

export function SettingsModal({ isOpen, onClose, user }) {
    const { theme, setTheme } = useTheme();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your preferences</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Tabs */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

                    {/* Appearance Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Monitor className="w-5 h-5 text-purple-500" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => setTheme("light")}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                            >
                                <div className="p-2 bg-white rounded-full shadow-sm">
                                    <Sun className="w-6 h-6 text-orange-500" />
                                </div>
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Light</span>
                            </button>

                            <button
                                onClick={() => setTheme("dark")}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                            >
                                <div className="p-2 bg-gray-900 rounded-full shadow-sm">
                                    <Moon className="w-6 h-6 text-blue-400" />
                                </div>
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Dark</span>
                            </button>

                            <button
                                onClick={() => setTheme("system")}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'system' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'}`}
                            >
                                <div className="p-2 bg-gradient-to-r from-white to-gray-900 rounded-full shadow-sm border border-gray-200">
                                    <Monitor className="w-6 h-6 text-gray-500" />
                                </div>
                                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">System</span>
                            </button>
                        </div>
                    </section>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* Profile Section (Read Only for now) */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-5 h-5 text-purple-500" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h3>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl">
                                {user?.username?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{user?.username}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">User ID: #{user?.id}</div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* Application Info */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-purple-500" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">About</h3>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                            <p>NeuroFiq Content AI Agent</p>
                            <p>Version 1.2.0 (Stable)</p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
