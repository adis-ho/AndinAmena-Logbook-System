import { supabase } from '../lib/supabase';
import type { User, Unit, LogbookEntry, Etoll } from '../types';

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

            // Fetch profile to check status - REQUIRED for login
            try {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    console.error('[ApiService] Profile fetch error:', profileError.message);
                    // Cannot verify user status, fail safe - logout
                    await supabase.auth.signOut();
                    return null;
                }

                if (profile) {
                    console.log('[ApiService] Profile found:', profile);

                    // CHECK: Block inactive users
                    if (profile.status === 'inactive') {
                        console.log('[ApiService] User is inactive, logging out...');
                        await supabase.auth.signOut();
                        throw new Error('INACTIVE_USER');
                    }

                    return {
                        id: profile.id,
                        username: profile.username,
                        full_name: profile.full_name,
                        role: profile.role as User['role'],
                        status: (profile.status as User['status']) || 'active',
                        operational_balance: profile.operational_balance || 0
                    };
                }

                // Profile not found - fail safe
                console.error('[ApiService] Profile not found for user');
                await supabase.auth.signOut();
                return null;
            } catch (profileErr) {
                // Handle inactive user error
                if (profileErr instanceof Error && profileErr.message === 'INACTIVE_USER') {
                    throw profileErr;
                }
                console.warn('[ApiService] Profile fetch failed:', profileErr);
                await supabase.auth.signOut();
                return null;
            }
        } catch (err) {
            // Propagate INACTIVE_USER error
            if (err instanceof Error && err.message === 'INACTIVE_USER') {
                throw err;
            }
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
                status: 'active',
                operational_balance: 0
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
                        status: (profile.status as User['status']) || 'active',
                        operational_balance: profile.operational_balance || 0
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
                status: 'active',
                operational_balance: 0
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
            status: (profile.status as User['status']) || 'active',
            operational_balance: profile.operational_balance || 0
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
            status: (data.status as User['status']) || 'active',
            operational_balance: data.operational_balance || 0
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
            status: 'active',
            operational_balance: 0
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

    // Hard delete - delete permanently (and cleanup logbooks)
    deleteUserPermanently: async (id: string): Promise<void> => {
        // 1. Delete associated logbooks first (no cascade in schema for logbooks)
        const { error: logbookError } = await supabase
            .from('logbooks')
            .delete()
            .eq('driver_id', id);

        if (logbookError) {
            console.error('[ApiService] Delete user logbooks error:', logbookError.message);
            throw logbookError;
        }

        // 2. Delete profile
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.error('[ApiService] Hard delete user error:', profileError.message);
            throw profileError;
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
            etoll_id: log.etoll_id || undefined,
            client_name: log.client_name || '',
            rute: log.rute || '',
            keterangan: log.keterangan || '',
            toll_cost: log.toll_cost || 0,
            parking_cost: log.parking_cost || 0,
            operational_cost: log.operational_cost || 0,
            status: log.status as LogbookEntry['status'],
            created_at: log.created_at
        }));
    },

    getLogbooksPaginated: async (params: {
        page: number;
        pageSize: number;
        driverId?: string;
        unitId?: string;
        clientName?: string;
        dateStart?: string;
        dateEnd?: string;
        status?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{ data: LogbookEntry[]; count: number }> => {
        let query = supabase
            .from('logbooks')
            .select('*', { count: 'exact' });

        // Apply filters
        if (params.driverId) query = query.eq('driver_id', params.driverId);
        if (params.unitId) query = query.eq('unit_id', params.unitId);
        if (params.clientName) query = query.ilike('client_name', `%${params.clientName}%`);
        if (params.dateStart) query = query.gte('date', params.dateStart);
        if (params.dateEnd) query = query.lte('date', params.dateEnd);
        if (params.status && params.status !== 'all') query = query.eq('status', params.status);

        // Sorting (default to date)
        const order = params.sortOrder || 'desc';
        // Secondary sort by created_at to ensure consistent pagination
        query = query.order('date', { ascending: order === 'asc' })
            .order('created_at', { ascending: false });

        // Pagination
        const from = (params.page - 1) * params.pageSize;
        const to = from + params.pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('[ApiService] Get logbooks paginated error:', error.message);
            return { data: [], count: 0 };
        }

        const logbooks = data.map(log => ({
            id: log.id,
            date: log.date,
            driver_id: log.driver_id,
            unit_id: log.unit_id,
            etoll_id: log.etoll_id || undefined,
            client_name: log.client_name || '',
            rute: log.rute || '',
            keterangan: log.keterangan || '',
            toll_cost: log.toll_cost || 0,
            parking_cost: log.parking_cost || 0,
            operational_cost: log.operational_cost || 0,
            status: log.status as LogbookEntry['status'],
            created_at: log.created_at
        }));

        return { data: logbooks, count: count || 0 };
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
            etoll_id: log.etoll_id || undefined,
            client_name: log.client_name || '',
            rute: log.rute || '',
            keterangan: log.keterangan || '',
            toll_cost: log.toll_cost || 0,
            parking_cost: log.parking_cost || 0,
            operational_cost: log.operational_cost || 0,
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
            etoll_id: data.etoll_id || undefined,
            client_name: data.client_name || '',
            rute: data.rute || '',
            keterangan: data.keterangan || '',
            toll_cost: data.toll_cost || 0,
            parking_cost: data.parking_cost || 0,
            operational_cost: data.operational_cost || 0,
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
                etoll_id: entry.etoll_id || null,
                client_name: entry.client_name,
                rute: entry.rute,
                keterangan: entry.keterangan,
                toll_cost: entry.toll_cost || 0,
                parking_cost: entry.parking_cost || 0,
                operational_cost: entry.operational_cost || 0,
                status: entry.status
            })
            .select()
            .single();

        if (error || !data) {
            console.error('[ApiService] Create logbook error:', error?.message);
            throw error;
        }

        // Note: Balance deduction moved to updateLogbookStatus (only when approved)

        return {
            id: data.id,
            date: data.date,
            driver_id: data.driver_id,
            unit_id: data.unit_id,
            etoll_id: data.etoll_id || undefined,
            client_name: data.client_name || '',
            rute: data.rute || '',
            keterangan: data.keterangan || '',
            toll_cost: data.toll_cost || 0,
            parking_cost: data.parking_cost || 0,
            operational_cost: data.operational_cost || 0,
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
                etoll_id: updates.etoll_id || null,
                client_name: updates.client_name,
                rute: updates.rute,
                keterangan: updates.keterangan,
                toll_cost: updates.toll_cost,
                parking_cost: updates.parking_cost,
                operational_cost: updates.operational_cost,
                status: updates.status
            })
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Update logbook error:', error.message);
            throw error;
        }
    },

    updateLogbookStatus: async (id: string, status: LogbookEntry['status']): Promise<void> => {
        // First, get the logbook to check costs and driver_id
        const { data: logbook } = await supabase
            .from('logbooks')
            .select('driver_id, etoll_id, toll_cost, operational_cost, status')
            .eq('id', id)
            .single();

        // Update the status
        const { error } = await supabase
            .from('logbooks')
            .update({ status })
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Update status error:', error.message);
            throw error;
        }

        // Deduct balances ONLY when status changes to 'approved'
        // and only if it wasn't already approved before
        if (status === 'approved' && logbook && logbook.status !== 'approved') {
            // Deduct E-Toll balance
            if (logbook.etoll_id && logbook.toll_cost > 0) {
                const { data: etollData } = await supabase
                    .from('etolls')
                    .select('balance')
                    .eq('id', logbook.etoll_id)
                    .single();

                if (etollData) {
                    const newBalance = Math.max(0, etollData.balance - logbook.toll_cost);
                    await supabase
                        .from('etolls')
                        .update({ balance: newBalance })
                        .eq('id', logbook.etoll_id);
                    console.log(`[ApiService] E-Toll balance deducted: ${logbook.toll_cost} from card ${logbook.etoll_id}`);
                }
            }

            // Deduct Driver's Operational Balance
            if (logbook.operational_cost > 0 && logbook.driver_id) {
                const { data: driverData } = await supabase
                    .from('profiles')
                    .select('operational_balance')
                    .eq('id', logbook.driver_id)
                    .single();

                if (driverData) {
                    const newBalance = Math.max(0, (driverData.operational_balance || 0) - logbook.operational_cost);
                    await supabase
                        .from('profiles')
                        .update({ operational_balance: newBalance })
                        .eq('id', logbook.driver_id);
                    console.log(`[ApiService] Driver operational balance deducted: ${logbook.operational_cost} from driver ${logbook.driver_id}`);
                }
            }
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

    // ==================== E-TOLLS ====================
    getEtolls: async (): Promise<Etoll[]> => {
        const { data, error } = await supabase
            .from('etolls')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[ApiService] Get etolls error:', error.message);
            return [];
        }

        return data.map(e => ({
            id: e.id,
            card_name: e.card_name,
            card_number: e.card_number || undefined,
            balance: e.balance || 0,
            status: e.status as Etoll['status'],
            created_at: e.created_at
        }));
    },

    getActiveEtolls: async (): Promise<Etoll[]> => {
        const { data, error } = await supabase
            .from('etolls')
            .select('*')
            .eq('status', 'active')
            .order('card_name', { ascending: true });

        if (error) {
            console.error('[ApiService] Get active etolls error:', error.message);
            return [];
        }

        return data.map(e => ({
            id: e.id,
            card_name: e.card_name,
            card_number: e.card_number || undefined,
            balance: e.balance || 0,
            status: e.status as Etoll['status'],
            created_at: e.created_at
        }));
    },

    createEtoll: async (etoll: Omit<Etoll, 'id' | 'created_at'>): Promise<Etoll> => {
        const { data, error } = await supabase
            .from('etolls')
            .insert({
                card_name: etoll.card_name,
                card_number: etoll.card_number || null,
                balance: etoll.balance || 0,
                status: etoll.status || 'active'
            })
            .select()
            .single();

        if (error || !data) {
            console.error('[ApiService] Create etoll error:', error?.message);
            throw error;
        }

        return {
            id: data.id,
            card_name: data.card_name,
            card_number: data.card_number || undefined,
            balance: data.balance || 0,
            status: data.status as Etoll['status'],
            created_at: data.created_at
        };
    },

    updateEtoll: async (id: string, updates: Partial<Etoll>): Promise<void> => {
        const { error } = await supabase
            .from('etolls')
            .update({
                card_name: updates.card_name,
                card_number: updates.card_number || null,
                balance: updates.balance,
                status: updates.status
            })
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Update etoll error:', error.message);
            throw error;
        }
    },

    deleteEtoll: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('etolls')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[ApiService] Delete etoll error:', error.message);
            throw error;
        }
    },

    // ==================== DRIVER OPERATIONAL BALANCE ====================
    getDriversWithBalance: async (): Promise<User[]> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'driver')
            .order('full_name', { ascending: true });

        if (error) {
            console.error('[ApiService] Get drivers with balance error:', error.message);
            return [];
        }

        return data.map(profile => ({
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            role: profile.role as User['role'],
            status: (profile.status as User['status']) || 'active',
            operational_balance: profile.operational_balance || 0
        }));
    },

    topUpDriverBalance: async (driverId: string, amount: number): Promise<void> => {
        // Get current balance
        const { data: driver } = await supabase
            .from('profiles')
            .select('operational_balance')
            .eq('id', driverId)
            .single();

        if (driver) {
            const newBalance = (driver.operational_balance || 0) + amount;
            const { error } = await supabase
                .from('profiles')
                .update({ operational_balance: newBalance })
                .eq('id', driverId);

            if (error) {
                console.error('[ApiService] Top up driver balance error:', error.message);
                throw error;
            }
        }
    },

    getDriverBalance: async (driverId: string): Promise<number> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('operational_balance')
            .eq('id', driverId)
            .single();

        if (error || !data) {
            console.error('[ApiService] Get driver balance error:', error?.message);
            return 0;
        }

        return data.operational_balance || 0;
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
    },

    // ==================== DASHBOARD STATISTICS (RPC) ====================
    getAdminDashboardStats: async (periodDays: number = 7): Promise<{
        totalLogbooks: number;
        todayLogbooks: number;
        weekLogbooks: number;
        monthLogbooks: number;
        totalDrivers: number;
        totalUnits: number;
        totalCost: number;
        todayCost: number;
        periodCost: number;
        statusData: Array<{ name: string; value: number }>;
        dailyData: Array<{ date: string; count: number; cost: number }>;
        topDrivers: Array<{ name: string; cost: number }>;
        recentLogbooks: Array<{
            id: string;
            date: string;
            client_name: string;
            rute: string;
            toll_cost: number;
            operational_cost: number;
            status: string;
            driver_name: string;
        }>;
    } | null> => {
        try {
            const { data, error } = await supabase.rpc('get_admin_dashboard_stats', {
                period_days: periodDays
            });

            if (error) {
                console.error('[ApiService] Dashboard stats RPC error:', error.message);
                return null;
            }

            return data;
        } catch (err) {
            console.error('[ApiService] Dashboard stats error:', err);
            return null;
        }
    }
};
