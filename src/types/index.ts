export type UserRole = 'admin' | 'driver';

export interface User {
    id: string;
    username: string;
    full_name: string;
    role: UserRole;
    status: 'active' | 'inactive';
}

export interface Unit {
    id: string;
    name: string; // e.g. "Avanza White"
    plate_number: string;
    status: 'available' | 'maintenance' | 'in-use';
}

export type LogbookStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface LogbookEntry {
    id: string;
    date: string; // ISO Date
    driver_id: string;
    unit_id: string;
    start_km: number;
    end_km: number;
    total_km: number;
    activities: string; // Description of activities
    fuel_cost: number;
    toll_cost: number;
    parking_cost: number;
    other_cost: number;
    total_cost: number;
    status: LogbookStatus;
    created_at: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
