import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar (hidden by default, shown on hamburger click) */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header */}
                <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

                {/* Main area */}
                <main className="flex-1 p-4 lg:p-8 overflow-auto">
                    <Outlet />
                </main>

                {/* Footer */}
                <footer className="py-4 px-6 text-center text-sm text-gray-500 border-t border-gray-100 bg-white">
                    © 2026 Andin-Amena Laporan Harian. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
