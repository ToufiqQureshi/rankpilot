import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

export const DashboardLayout = ({ onLogout }) => {
    return (
        <div className="flex h-screen w-screen bg-[#f9f9f9] overflow-hidden">
            {/* Vertical App Navigation */}
            <AppSidebar onLogout={onLogout} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
};
