import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type Notification } from '../context/NotificationContext';
import {
    Bell,
    Check,
    CheckCheck,
    BookOpen,
    UserPlus,
    AlertCircle,
    CheckCircle,
    XCircle,
    Trash2
} from 'lucide-react';
import { cn } from '../utils/cn';

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID');
}

function getNotificationIcon(type: Notification['type']) {
    const icons = {
        logbook_submitted: { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-100' },
        logbook_approved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
        logbook_rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
        user_registered: { icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-100' },
        system: { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-100' }
    };
    return icons[type] || icons.system;
}

export default function NotificationPanel() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
    };

    return (
        <div ref={panelRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative p-2.5 rounded-xl transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    isOpen
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
                )}
                aria-label="Notifikasi"
                aria-expanded={isOpen}
            >
                <Bell className="h-5 w-5" aria-hidden="true" />

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center px-1 text-[10px] font-black text-white bg-red-500 rounded-full shadow-sm ring-2 ring-white animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <div
                className={cn(
                    "fixed left-4 right-4 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-[420px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden transition-all duration-300 origin-top-right z-50",
                    isOpen
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                )}
                role="dialog"
                aria-label="Panel Notifikasi"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-b border-indigo-700/50">
                    <div className="flex items-center gap-2.5">
                        <Bell className="h-4 w-4 text-blue-100" aria-hidden="true" />
                        <span className="font-black tracking-tight text-[15px]">Notifikasi</span>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white rounded-full ml-1">
                                {unreadCount} Baru
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="p-1.5 text-blue-100 hover:text-white hover:bg-white/20 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/50 tooltip-trigger"
                                aria-label="Tandai semua dibaca"
                            >
                                <CheckCheck className="h-4 w-4" aria-hidden="true" />
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAllNotifications}
                                className="p-1.5 text-blue-100 hover:text-red-100 hover:bg-red-500/30 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/50 tooltip-trigger"
                                aria-label="Hapus semua notifikasi"
                            >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Notification List */}
                <div
                    className="max-h-[400px] overflow-y-auto overscroll-contain"
                >
                    {notifications.length === 0 ? (
                        <div className="py-16 text-center px-4">
                            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Bell className="h-8 w-8 text-gray-300" aria-hidden="true" />
                            </div>
                            <p className="text-gray-900 font-bold mb-1">Pemberitahuan Kosong</p>
                            <p className="text-gray-500 text-xs font-medium">Anda belum menerima notifikasi apapun hari ini.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50/80">
                            {notifications.map((notification) => {
                                const { icon: Icon, color, bg } = getNotificationIcon(notification.type);

                                return (
                                    <div
                                        key={notification.id}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleNotificationClick(notification);
                                            }
                                        }}
                                        className={cn(
                                            "group relative flex gap-4 p-5 cursor-pointer outline-none transition-all duration-200 focus-visible:bg-blue-50",
                                            notification.read
                                                ? "bg-white hover:bg-gray-50/80"
                                                : "bg-[#F8FAFF] hover:bg-blue-50/50"
                                        )}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        {/* Icon */}
                                        <div className={cn("flex-shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm border border-black/5", bg)}>
                                            <Icon className={cn("h-4.5 w-4.5", color)} aria-hidden="true" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-start justify-between gap-3 mb-1">
                                                <p className={cn(
                                                    "text-[13px] line-clamp-1 truncate",
                                                    notification.read ? "font-semibold text-gray-700" : "font-black text-gray-900"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="flex-shrink-0 h-2 w-2 bg-blue-600 rounded-full mt-1.5 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></span>
                                                )}
                                            </div>
                                            <p className="text-[11px] font-medium text-gray-500 line-clamp-2 leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                                                {formatRelativeTime(notification.createdAt)}
                                            </p>
                                        </div>

                                        {/* Hover Actions */}
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl shadow-sm border border-gray-100 translate-x-2 group-hover:translate-x-0">
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                    aria-label="Tandai dibaca"
                                                >
                                                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearNotification(notification.id);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                                aria-label="Hapus notifikasi"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Simplification */}
                {notifications.length > 0 && (
                    <div className="bg-gray-50/80 border-t border-gray-100 p-2">
                        <button
                            onClick={markAllAsRead}
                            className="w-full py-2.5 text-[11px] font-bold text-gray-500 hover:text-gray-900 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200 uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-gray-200"
                        >
                            Tandai Semua Telah Dibaca
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
