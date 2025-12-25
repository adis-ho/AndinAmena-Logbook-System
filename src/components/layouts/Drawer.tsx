import { Fragment } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Transition, Dialog } from '@headlessui/react';
import {
    LayoutDashboard,
    BookOpen,
    History,
    Users,
    Car,
    CreditCard,
    Wallet,
    X,
    LogOut
} from 'lucide-react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/logbooks', label: 'Laporan Harian', icon: BookOpen },
    { to: '/admin/etolls', label: 'E-Toll', icon: CreditCard },
    { to: '/admin/units', label: 'Unit', icon: Car },
    { to: '/admin/users', label: 'Pengguna', icon: Users },
    { to: '/admin/operational', label: 'Uang Operasional', icon: Wallet },
];

const driverLinks = [
    { to: '/driver', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/driver/logbook', label: 'Input Laporan', icon: BookOpen },
    { to: '/driver/history', label: 'Riwayat', icon: History },
];

export default function Drawer({ isOpen, onClose }: DrawerProps) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const links = user?.role === 'admin' ? adminLinks : driverLinks;

    const handleLogout = async () => {
        await logout();
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[9999] lg:hidden" onClose={onClose}>
                {/* Overlay */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                {/* Drawer Panel */}
                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <Transition.Child
                            as={Fragment}
                            enter="transform transition ease-out duration-300"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transform transition ease-in duration-200"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <Car className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="font-bold text-lg text-gray-900">Laporan Harian</span>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* User Info */}
                                {user && (
                                    <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md overflow-hidden">
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
                                <nav className="p-4 space-y-1 flex-1">
                                    {links.map((link) => {
                                        const Icon = link.icon;
                                        const isActive = location.pathname === link.to;

                                        return (
                                            <NavLink
                                                key={link.to}
                                                to={link.to}
                                                end={link.end}
                                                onClick={onClose}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                            >
                                                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                                <span>{link.label}</span>
                                                {isActive && (
                                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                                                )}
                                            </NavLink>
                                        );
                                    })}
                                </nav>

                                {/* Logout Button */}
                                <div className="p-4 border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span>Keluar</span>
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
