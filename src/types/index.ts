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
    client_name: string; // User/Tamu/Client name
    rute: string; // Rute perjalanan
    keterangan: string; // Keterangan/catatan
    toll_parking_cost: number; // Biaya Tol & Parkir (gabungan)
    status: LogbookStatus;
    created_at: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
