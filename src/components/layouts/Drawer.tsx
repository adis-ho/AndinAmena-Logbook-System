import { useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    Car,
    Users,
    PlusCircle,
    History,
    LogOut,
    X,
    ChevronRight,
    CreditCard,
    Wallet
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Drawer({ isOpen, onClose }: DrawerProps) {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Close on Escape key
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleEscape]);

    const adminLinks = [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/logbooks', label: 'Laporan Harian', icon: BookOpen },
        { to: '/admin/etolls', label: 'E-Toll', icon: CreditCard },
        { to: '/admin/operational', label: 'Uang Operasional', icon: Wallet },
        { to: '/admin/units', label: 'Units', icon: Car },
        { to: '/admin/users', label: 'Users', icon: Users },
    ];

    const driverLinks = [
        { to: '/driver', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/driver/logbook', label: 'Input Laporan', icon: PlusCircle },
        { to: '/driver/history', label: 'Riwayat', icon: History },
    ];

    const links = user?.role === 'admin' ? adminLinks : driverLinks;

    const handleLogout = async () => {
        await logout();
        onClose();
    };

    return (
        <>
            {/* Backdrop with blur effect */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer Panel */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ease-out",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation drawer"
            >
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Car className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-900">Amena Logs</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close drawer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* User Info */}
                {user && (
                    <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
                                {user.full_name.charAt(0).toUpperCase()}
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
                <nav className="p-4 space-y-1 flex-1">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.to;

                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={onClose}
                                className={cn(
                                    "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-blue-50 text-blue-700 font-semibold"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon className={cn(
                                    "h-5 w-5 transition-colors",
                                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                                )} />
                                <span className="flex-1">{link.label}</span>
                                {isActive && (
                                    <ChevronRight className="h-4 w-4 text-blue-400" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
