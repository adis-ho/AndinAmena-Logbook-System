import { supabase } from '../lib/supabase';
import type { User, Unit, LogbookEntry } from '../types';

// =============================================
// API SERVICE - Supabase Implementation
// =============================================

export const ApiService = {
    // ==================== AUTH ====================
    login: async (email: string, password: string): Promise<User | null> => {
        console.log('[ApiService] Attempting login for:', email);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('[ApiService] Login error:', error.message);
                return null;
            }

            if (!data.user) {
                console.error('[ApiService] No user returned');
                return null;
            }

            console.log('[ApiService] Auth successful for:', data.user.id);

            // Try to fetch profile, but don't block on it
            try {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profile && !profileError) {
                    console.log('[ApiService] Profile found:', profile);
                    return {
                        id: profile.id,
                        username: profile.username,
                        full_name: profile.full_name,
                        role: profile.role as User['role'],
                        status: 'active'
                    };
                }
            } catch (profileErr) {
                console.warn('[ApiService] Profile fetch failed:', profileErr);
            }

            // Fallback: return user from auth metadata
            console.log('[ApiService] Using metadata fallback');
            const metadata = data.user.user_metadata || {};
            return {
                id: data.user.id,
                username: metadata.username || email.split('@')[0],
                full_name: metadata.full_name || 'User',
                role: (metadata.role as User['role']) || 'driver',
                status: 'active'
            };
        } catch (err) {
            console.error('[ApiService] Login exception:', err);
            return null;
        }
    },

    logout: async (): Promise<void> => {
        await supabase.auth.signOut();
    },

    register: async (userData: {
        email: string;
        password: string;
        username: string;
        full_name: string;
    }): Promise<User | null> => {
        console.log('[ApiService] Attempting registration for:', userData.email);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        username: userData.username,
                        full_name: userData.full_name,
                        role: 'driver'
                    }
                }
            });

            console.log('[ApiService] SignUp response:', { data, error });

            if (error) {
                console.error('[ApiService] Registration error:', error.message);
                return null;
            }

            if (!data.user) {
                console.error('[ApiService] No user returned from signup');
                return null;
            }

            console.log('[ApiService] Registration successful:', data.user.id);

            return {
                id: data.user.id,
                username: userData.username,
                full_name: userData.full_name,
                role: 'driver',
                status: 'active'
            };
        } catch (err) {
            console.error('[ApiService] Registration exception:', err);
            return null;
        }
    },

    getCurrentUser: async (): Promise<User | null> => {
        console.log('[ApiService] Getting current user...');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('[ApiService] No auth user found');
                return null;
            }

            console.log('[ApiService] Auth user found:', user.id);

            // Try to fetch profile
            try {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile && !profileError) {
                    console.log('[ApiService] Profile found');
                    return {
                        id: profile.id,
                        username: profile.username,
                        full_name: profile.full_name,
                        role: profile.role as User['role'],
                        status: 'active'
                    };
                }
            } catch (profileErr) {
                console.warn('[ApiService] Profile fetch error:', profileErr);
            }

            // Fallback to auth metadata
            console.log('[ApiService] Using metadata fallback for getCurrentUser');
            const metadata = user.user_metadata || {};
            return {
                id: user.id,
                username: metadata.username || user.email?.split('@')[0] || 'user',
                full_name: metadata.full_name || 'User',
                role: (metadata.role as User['role']) || 'driver',
                status: 'active'
            };
        } catch (err) {
            console.error('[ApiService] getCurrentUser exception:', err);
            return null;
        }
    },

    // ==================== USERS ====================
    getUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[ApiService] Get users error:', error.message);
            return [];
        }

        return data.map(profile => ({
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            role: profile.role as User['role'],
            status: 'active'
        }));
    },

    getUserById: async (id: string): Promise<User | undefined> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return undefined;

        return {
            id: data.id,
            username: data.username,
            full_name: data.full_name,
            role: data.role as User['role'],
            status: 'active'
        };
    },

    createUser: async (userData: {
        email: string;
        password: string;
        username: string;
        full_name: string;
        role: User['role'];
    }): Promise<User | null> => {
        // Admin creating user - use signUp with metadata
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    username: userData.username,
                    full_name: userData.full_name,
                    role: userData.role
                }
            }
        });

        if (error || !data.user) {
            console.error('[ApiService] Create user error:', error?.message);
            return null;
        }

        return {
            id: data.user.id,
            username: userData.username,
            full_name: userData.full_name,
            role: userData.role,
            status: 'active'
        };
    },

    updateUser: async (id: string, updates: Partial<User>): Promise<void> => {
        const { error } = await supabase
            .from('profiles')
            .update({
                username: updates.username,
                full_name: updates.full_name,
                role: updates.role
            })
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Update user error:', error.message);
            throw error;
        }
    },

    // Soft delete - set status to inactive instead of hard delete
    deleteUser: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('profiles')
            .update({ status: 'inactive' })
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Delete user error:', error.message);
            throw error;
        }
    },

    // Reactivate user - set status back to active
    reactivateUser: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('profiles')
            .update({ status: 'active' })
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Reactivate user error:', error.message);
            throw error;
        }
    },

    // ==================== UNITS ====================
    getUnits: async (): Promise<Unit[]> => {
        const { data, error } = await supabase
            .from('units')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[ApiService] Get units error:', error.message);
            return [];
        }

        return data.map(unit => ({
            id: unit.id,
            name: unit.name,
            plate_number: unit.plate_number,
            status: unit.status as Unit['status']
        }));
    },

    getUnitById: async (id: string): Promise<Unit | undefined> => {
        const { data, error } = await supabase
            .from('units')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return undefined;

        return {
            id: data.id,
            name: data.name,
            plate_number: data.plate_number,
            status: data.status as Unit['status']
        };
    },

    createUnit: async (unit: Omit<Unit, 'id'>): Promise<Unit> => {
        const { data, error } = await supabase
            .from('units')
            .insert({
                name: unit.name,
                plate_number: unit.plate_number,
                status: unit.status
            })
            .select()
            .single();

        if (error || !data) {
            console.error('[ApiService] Create unit error:', error?.message);
            throw error;
        }

        return {
            id: data.id,
            name: data.name,
            plate_number: data.plate_number,
            status: data.status as Unit['status']
        };
    },

    updateUnit: async (id: string, updates: Partial<Unit>): Promise<void> => {
        const { error } = await supabase
            .from('units')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Update unit error:', error.message);
            throw error;
        }
    },

    deleteUnit: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('units')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Delete unit error:', error.message);
            throw error;
        }
    },

    // ==================== LOGBOOKS ====================
    getLogbooks: async (): Promise<LogbookEntry[]> => {
        const { data, error } = await supabase
            .from('logbooks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[ApiService] Get logbooks error:', error.message);
            return [];
        }

        return data.map(log => ({
            id: log.id,
            date: log.date,
            driver_id: log.driver_id,
            unit_id: log.unit_id,
            client_name: log.client_name || '',
            rute: log.rute || '',
            keterangan: log.keterangan || '',
            toll_parking_cost: log.toll_parking_cost || 0,
            status: log.status as LogbookEntry['status'],
            created_at: log.created_at
        }));
    },

    getLogbooksByDriverId: async (driverId: string): Promise<LogbookEntry[]> => {
        const { data, error } = await supabase
            .from('logbooks')
            .select('*')
            .eq('driver_id', driverId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[ApiService] Get driver logbooks error:', error.message);
            return [];
        }

        return data.map(log => ({
            id: log.id,
            date: log.date,
            driver_id: log.driver_id,
            unit_id: log.unit_id,
            client_name: log.client_name || '',
            rute: log.rute || '',
            keterangan: log.keterangan || '',
            toll_parking_cost: log.toll_parking_cost || 0,
            status: log.status as LogbookEntry['status'],
            created_at: log.created_at
        }));
    },

    getLogbookById: async (id: string): Promise<LogbookEntry | undefined> => {
        const { data, error } = await supabase
            .from('logbooks')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return undefined;

        return {
            id: data.id,
            date: data.date,
            driver_id: data.driver_id,
            unit_id: data.unit_id,
            client_name: data.client_name || '',
            rute: data.rute || '',
            keterangan: data.keterangan || '',
            toll_parking_cost: data.toll_parking_cost || 0,
            status: data.status as LogbookEntry['status'],
            created_at: data.created_at
        };
    },

    createLogbook: async (entry: Omit<LogbookEntry, 'id' | 'created_at'>): Promise<LogbookEntry> => {
        const { data, error } = await supabase
            .from('logbooks')
            .insert({
                date: entry.date,
                driver_id: entry.driver_id,
                unit_id: entry.unit_id,
                client_name: entry.client_name,
                rute: entry.rute,
                keterangan: entry.keterangan,
                toll_parking_cost: entry.toll_parking_cost || 0,
                status: entry.status
            })
            .select()
            .single();

        if (error || !data) {
            console.error('[ApiService] Create logbook error:', error?.message);
            throw error;
        }

        return {
            id: data.id,
            date: data.date,
            driver_id: data.driver_id,
            unit_id: data.unit_id,
            client_name: data.client_name || '',
            rute: data.rute || '',
            keterangan: data.keterangan || '',
            toll_parking_cost: data.toll_parking_cost || 0,
            status: data.status as LogbookEntry['status'],
            created_at: data.created_at
        };
    },

    updateLogbook: async (id: string, updates: Partial<LogbookEntry>): Promise<void> => {
        const { error } = await supabase
            .from('logbooks')
            .update({
                date: updates.date,
                unit_id: updates.unit_id,
                client_name: updates.client_name,
                rute: updates.rute,
                keterangan: updates.keterangan,
                toll_parking_cost: updates.toll_parking_cost,
                status: updates.status
            })
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Update logbook error:', error.message);
            throw error;
        }
    },

    updateLogbookStatus: async (id: string, status: LogbookEntry['status']): Promise<void> => {
        const { error } = await supabase
            .from('logbooks')
            .update({ status })
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Update status error:', error.message);
            throw error;
        }
    },

    deleteLogbook: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('logbooks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Delete logbook error:', error.message);
            throw error;
        }
    },

    // ==================== NOTIFICATIONS ====================
    getNotifications: async (userId: string): Promise<Array<{
        id: string;
        user_id: string;
        type: string;
        title: string;
        message: string;
        link?: string;
        read: boolean;
        created_at: string;
    }>> => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('[ApiService] Get notifications error:', error.message);
            return [];
        }

        return data || [];
    },

    createNotification: async (notification: {
        user_id: string;
        type: 'logbook_submitted' | 'logbook_approved' | 'logbook_rejected' | 'user_registered' | 'system';
        title: string;
        message: string;
        link?: string;
    }): Promise<void> => {
        const { error } = await supabase
            .from('notifications')
            .insert(notification);

        if (error) {
            console.error('[ApiService] Create notification error:', error.message);
            // Don't throw - notification creation should not block main operations
        }
    },

    markNotificationAsRead: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Mark notification read error:', error.message);
        }
    },

    markAllNotificationsAsRead: async (userId: string): Promise<void> => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) {
            console.error('[ApiService] Mark all notifications read error:', error.message);
        }
    },

    deleteNotification: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Delete notification error:', error.message);
        }
    },

    // Helper: Send notification to all admins
    notifyAdmins: async (notification: {
        type: 'logbook_submitted' | 'user_registered' | 'system';
        title: string;
        message: string;
        link?: string;
    }): Promise<void> => {
        // Get all admin users
        const { data: admins, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin');

        if (error || !admins) {
            console.error('[ApiService] Get admins error:', error?.message);
            return;
        }

        // Create notification for each admin
        for (const admin of admins) {
            await ApiService.createNotification({
                user_id: admin.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link: notification.link
            });
        }
    }
};
