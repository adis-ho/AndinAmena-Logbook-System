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
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();

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
                    "relative p-2.5 rounded-xl transition-all duration-200",
                    isOpen
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
                aria-label="Notifications"
                aria-expanded={isOpen}
            >
                <Bell className="h-5 w-5" />

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <div
                className={cn(
                    "absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-top-right",
                    isOpen
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                )}
                role="menu"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span className="font-semibold">Notifikasi</span>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
                                {unreadCount} baru
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 text-xs text-blue-100 hover:text-white transition-colors"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Tandai semua dibaca
                        </button>
                    )}
                </div>

                {/* Notification List */}
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="py-12 text-center">
                            <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Tidak ada notifikasi</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {notifications.map((notification, index) => {
                                const { icon: Icon, color, bg } = getNotificationIcon(notification.type);

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "group relative flex gap-3 p-4 cursor-pointer transition-all duration-200",
                                            notification.read
                                                ? "bg-white hover:bg-gray-50"
                                                : "bg-blue-50/50 hover:bg-blue-50"
                                        )}
                                        onClick={() => handleNotificationClick(notification)}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        {/* Icon */}
                                        <div className={cn("flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center", bg)}>
                                            <Icon className={cn("h-5 w-5", color)} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm line-clamp-1",
                                                    notification.read ? "font-medium text-gray-700" : "font-semibold text-gray-900"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                {!notification.read && (
                                                    <span className="flex-shrink-0 h-2 w-2 bg-blue-500 rounded-full"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                                                {formatRelativeTime(notification.createdAt)}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Tandai dibaca"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearNotification(notification.id);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="p-3 bg-gray-50 border-t border-gray-100">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                            }}
                            className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
