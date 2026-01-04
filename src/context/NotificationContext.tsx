import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ApiService } from '../services/api';
import { supabase } from '../lib/supabase';

export interface Notification {
    id: string;
    type: 'logbook_submitted' | 'logbook_approved' | 'logbook_rejected' | 'user_registered' | 'system';
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    link?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotification: (id: string) => void;
    clearAllNotifications: () => void;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            return;
        }

        try {
            const data = await ApiService.getNotifications(user.id);
            const mapped: Notification[] = data.map(n => ({
                id: n.id,
                type: n.type as Notification['type'],
                title: n.title,
                message: n.message,
                read: n.read,
                createdAt: new Date(n.created_at),
                link: n.link
            }));
            setNotifications(mapped);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    }, [user]);

    // Initial fetch and real-time subscription
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        // Initial fetch
        fetchNotifications();

        // Subscribe to real-time updates for new notifications
        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('[Notifications] New notification:', payload);
                    const newNotif = payload.new as {
                        id: string;
                        type: string;
                        title: string;
                        message: string;
                        read: boolean;
                        created_at: string;
                        link?: string;
                    };

                    const mapped: Notification = {
                        id: newNotif.id,
                        type: newNotif.type as Notification['type'],
                        title: newNotif.title,
                        message: newNotif.message,
                        read: newNotif.read,
                        createdAt: new Date(newNotif.created_at),
                        link: newNotif.link
                    };

                    setNotifications(prev => [mapped, ...prev]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const updated = payload.new as { id: string; read: boolean };
                    setNotifications(prev =>
                        prev.map(n => n.id === updated.id ? { ...n, read: updated.read } : n)
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'notifications'
                },
                (payload) => {
                    const deleted = payload.old as { id: string };
                    setNotifications(prev => prev.filter(n => n.id !== deleted.id));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        await ApiService.markNotificationAsRead(id);
    };

    const markAllAsRead = async () => {
        if (!user) return;
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        await ApiService.markAllNotificationsAsRead(user.id);
    };

    const clearNotification = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));
        await ApiService.deleteNotification(id);
    };

    const clearAllNotifications = async () => {
        if (!user) return;
        // Optimistic update
        setNotifications([]);
        await ApiService.deleteAllNotifications(user.id);
    };

    const refreshNotifications = async () => {
        await fetchNotifications();
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            clearNotification,
            clearAllNotifications,
            refreshNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
