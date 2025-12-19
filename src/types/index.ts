export type UserRole = 'admin' | 'driver';

export interface User {
    id: string;
    username: string;
    full_name: string;
    role: UserRole;
    status: 'active' | 'inactive';
    operational_balance: number; // Saldo Uang Operasional per Driver
}

export interface Unit {
    id: string;
    name: string; // e.g. "Avanza White"
    plate_number: string;
    status: 'available' | 'maintenance' | 'in-use';
}

export interface Etoll {
    id: string;
    card_name: string;
    card_number?: string;
    balance: number;
    status: 'active' | 'inactive';
    created_at: string;
}

export type LogbookStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface LogbookEntry {
    id: string;
    date: string; // ISO Date
    driver_id: string;
    unit_id: string;
    etoll_id?: string; // Kartu E-Toll yang digunakan (opsional)
    client_name: string; // User/Tamu/Client name
    rute: string; // Rute perjalanan
    keterangan: string; // Keterangan/catatan
    toll_cost: number; // Biaya Tol
    parking_cost: number; // Biaya Parkir
    operational_cost: number; // Biaya Lain
    status: LogbookStatus;
    created_at: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}


