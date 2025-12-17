import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Drawer from './Drawer';
import Header from './Header';

export default function DashboardLayout() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Drawer Navigation */}
            <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex flex-col min-h-screen">
                <Header onMenuClick={() => setIsDrawerOpen(true)} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-4 px-6 text-center text-sm text-gray-500 border-t border-gray-100 bg-white">
                    © 2024 Amena Laporan Harian. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
