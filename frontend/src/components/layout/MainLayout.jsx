import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    Archive,
    Settings,
    Menu,
    X,
    CreditCard,
    User,
    Zap,
    Mic2,
    Layers
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, isOpen, isActive }) => (
    <Link
        to={path}
        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
            ? 'bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
    >
        <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'group-hover:text-white'}`} />
        <span className={`font-medium transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden lg:block'}`}>
            {label}
        </span>
        {isActive && isOpen && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_currentColor]" />
        )}
    </Link>
);

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: MessageSquare, label: 'AI Chat', path: '/' },
        { icon: Mic2, label: 'Brand Voices', path: '/brand-voice' },
        { icon: Layers, label: 'Campaigns', path: '/campaigns' },
        { icon: Archive, label: 'History', path: '/history' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-white selection:bg-primary/30">
            {/* Mobile Sidebar Overlay */}
            {!isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(true)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out border-r border-white/10 bg-slate-900/80 backdrop-blur-xl ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
                    }`}
            >
                <div className="flex flex-col h-full p-4">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/20">
                            <Zap className="w-6 h-6 text-white fill-white" />
                        </div>
                        <div className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden lg:block'}`}>
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                Content OS
                            </h1>
                            <p className="text-xs text-gray-500 font-medium tracking-wide">AI AGENT</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {menuItems.map((item) => (
                            <SidebarItem
                                key={item.path}
                                {...item}
                                isOpen={isSidebarOpen}
                                isActive={location.pathname === item.path || (item.path === '/' && location.pathname === '/chat')}
                            />
                        ))}
                    </nav>

                    {/* User & Credits */}
                    <div className="mt-auto space-y-4">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-600/10 border border-white/5 ${!isSidebarOpen && 'hidden lg:block'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-primary">Pro Plan</span>
                                <span className="text-xs text-gray-400">85% Used</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-primary to-violet-500 w-[85%]" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-white/10">
                                <User className="w-4 h-4 text-gray-300" />
                            </div>
                            <div className={`overflow-hidden transition-all ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden lg:block'}`}>
                                <p className="text-sm font-medium text-white truncate">Aditya Sharma</p>
                                <p className="text-xs text-gray-500 truncate">aditya@agency.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`transition-all duration-300 min-h-screen flex flex-col ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
                    }`}
            >
                {/* Top Header (Mobile Toggle + Breadcrumbs/Actions) */}
                <header className="sticky top-0 z-30 h-16 px-6 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    <div className="flex items-center gap-4">
                        {/* Add global search or notifications here later */}
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-6 animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
