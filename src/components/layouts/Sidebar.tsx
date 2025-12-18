import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, BookOpen, Car, Users, PlusCircle, History, LogOut, X, CreditCard, Wallet } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const location = useLocation();

    const adminLinks = [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/logbooks', label: 'Laporan Harian', icon: BookOpen },
        { to: '/admin/etolls', label: 'E-Toll', icon: CreditCard },
        { to: '/admin/operational', label: 'Uang Operasional', icon: Wallet },
        { to: '/admin/units', label: 'Unit Management', icon: Car },
        { to: '/admin/users', label: 'User Management', icon: Users },
    ];

    const driverLinks = [
        { to: '/driver', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/driver/logbook', label: 'Input Laporan', icon: PlusCircle },
        { to: '/driver/history', label: 'Riwayat Laporan', icon: History },
    ];

    const links = user?.role === 'admin' ? adminLinks : driverLinks;

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar Drawer */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-between px-6 font-bold text-xl border-b border-slate-800">
                    <span className="flex items-center gap-2">
                        <Car className="h-6 w-6 text-blue-400" />
                        Amena Logs
                    </span>
                    <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.to; // Exact match or startswtih? Simple match for now.
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => window.innerWidth < 1024 && onClose()}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                        : "text-gray-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {link.label}
                            </Link>
                        );
                    })}

                    <div className="pt-8 mt-4 border-t border-slate-800">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            Logout
                        </button>
                    </div>
                </nav>
            </aside>
        </>
    );
}
