import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Server,
    Settings,
    MessageSquare,
    LogOut,
    UserCircle,
    Megaphone
} from "lucide-react";
import { CPanelSettingsForm } from "../cpanel/CPanelSettingsForm";

export function Dashboard({ user, onLogout }) {
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState("overview");

    const menuItems = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "cpanel", label: "cPanel Connection", icon: Server },
        { id: "brand-voice", label: "Brand Voice", icon: Megaphone },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    const renderContent = () => {
        switch (activeView) {
            case "overview":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
                            <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Creator'}!</h2>
                            <p className="text-blue-100">Manage your content automation and server settings from one place.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Quick Stats/Cards could go here */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('cpanel')}>
                                <div className="p-3 bg-orange-100 w-fit rounded-xl text-orange-600 mb-4">
                                    <Server className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-gray-900">cPanel Status</h3>
                                <p className="text-sm text-gray-500 mt-1">Configure your server connection</p>
                            </div>
                        </div>
                    </div>
                );
            case "cpanel":
                return (
                    <div className="animate-in fade-in duration-300">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">cPanel Management</h2>
                            <p className="text-gray-500">Connect your hosting account for automated deployments</p>
                        </div>
                        <CPanelSettingsForm />
                    </div>
                );
            case "brand-voice":
                return (
                    <div className="animate-in fade-in duration-300">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Brand Voice</h2>
                            <p className="text-gray-500">Define your content persona (Coming Soon)</p>
                        </div>
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-gray-400">
                            <Megaphone className="w-12 h-12 mb-4 opacity-20" />
                            <p>Voice customization features coming soon.</p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center justify-center h-[60vh] text-gray-400">
                        Select an option from the sidebar
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-72 bg-white border-r border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                            {user?.name?.[0] || "A"}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">{user?.name || "User"}</h3>
                            <p className="text-xs text-gray-500">{user?.email || "user@example.com"}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                                ${activeView === item.id
                                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                            `}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-50/50 space-y-2">
                    <Link
                        to="/"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
                    >
                        <MessageSquare className="w-5 h-5" />
                        Back to Chat
                    </Link>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto p-8 lg:p-12">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
