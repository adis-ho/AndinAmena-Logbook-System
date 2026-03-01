import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, BookOpen, Car, Users, PlusCircle, History, LogOut, CreditCard, Wallet, BarChart3, FileText, X, ClipboardList } from 'lucide-react';
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
        { to: '/admin/driver-summary', label: 'Ringkasan Driver', icon: BarChart3 },
        { to: '/admin/laporan', label: 'Laporan Bulanan', icon: FileText },
        { to: '/admin/transactions', label: 'Riwayat Transaksi', icon: ClipboardList },
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
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 top-16 z-40 bg-black/50 transition-opacity duration-300 backdrop-blur-sm",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar Drawer */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Menu Navigasi"
                className={cn(
                    "fixed bottom-0 top-16 left-0 z-40 w-72 bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out flex flex-col border-r border-gray-100",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >

                {/* User Profile */}
                {user && (
                    <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold text-lg shadow-md overflow-hidden">
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    user.full_name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {user.full_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate capitalize">
                                    {user.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            aria-label="Tutup Menu"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto overscroll-contain">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.to;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 text-sm rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                                    isActive
                                        ? "bg-blue-50 text-blue-700 font-semibold"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} aria-hidden="true" />
                                <span>{link.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => {
                            logout();
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                        <LogOut className="h-5 w-5" aria-hidden="true" />
                        <span className="font-medium">Keluar</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
