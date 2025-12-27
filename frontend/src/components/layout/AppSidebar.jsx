import React from 'react';
import { MessageSquare, Layout, Server, Settings, Monitor, BookOpen, Send } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Logo } from '../ui/Logo';

export const AppSidebar = ({ onLogout }) => {
    const navigate = useNavigate();

    const navItems = [
        { icon: MessageSquare, label: "Chat", path: "/" },
        { icon: Send, label: "Campaigns", path: "/campaigns" },
        { icon: Server, label: "cPanel", path: "/cpanel" },
        { icon: Settings, label: "Settings", path: "/settings" },
    ];

    return (
        <aside className="w-[70px] h-full bg-white border-r border-gray-100 flex flex-col items-center py-6 z-50">
            {/* Logo */}
            <div className="mb-8 w-10 h-10 text-orange-600">
                <Logo />
            </div>

            {/* Nav Items */}
            <nav className="flex-1 w-full flex flex-col items-center gap-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group relative
                            ${isActive
                                ? 'bg-orange-50 text-orange-600 shadow-sm'
                                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                            }
                        `}
                    >
                        <item.icon className="w-5 h-5" />

                        {/* Tooltip */}
                        <div className="absolute left-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            {item.label}
                        </div>
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <button
                onClick={onLogout}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors mt-auto"
                title="Logout"
            >
                <LogOutIcon />
            </button>
        </aside>
    );
};

// Simple Icon Wrapper to avoid heavy imports if needed, 
// though lucide-react is efficiently tree-shaken usually.
const LogOutIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
    >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);
