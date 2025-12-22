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
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-20 bg-black/50 transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar Drawer */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-30 w-72 bg-white shadow-xl transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Car className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-900">Laporan Harian</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* User Profile */}
                {user && (
                    <div className="px-4 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-md overflow-hidden">
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    user.full_name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {user.full_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate capitalize">
                                    {user.role}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Links */}
                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.to;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-blue-50 text-blue-600 font-medium"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
                                <span>{link.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => { logout(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
