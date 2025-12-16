import type { LogbookEntry, Unit, User } from '../types';

// Mock Data Store (LEGACY - digunakan hanya untuk fallback)
const MOCK_USERS: User[] = [
    { id: '1', username: 'admin', full_name: 'Admin Amena', role: 'admin', status: 'active' },
    { id: '2', username: 'driver1', full_name: 'Budi Santoso', role: 'driver', status: 'active' },
];

const MOCK_UNITS: Unit[] = [
    { id: 'u1', name: 'Avanza White', plate_number: 'B 1234 ABC', status: 'available' },
    { id: 'u2', name: 'Innova Black', plate_number: 'B 5678 DEF', status: 'in-use' },
];

const MOCK_LOGBOOKS: LogbookEntry[] = [
    {
        id: 'l1',
        date: '2025-12-10',
        driver_id: '2',
        unit_id: 'u1',
        client_name: 'Bapak Ahmad',
        rute: 'Jakarta - Bandung',
        keterangan: 'Antar tamu VIP',
        toll_parking_cost: 35000,
        status: 'approved',
        created_at: '2025-12-10T08:00:00Z',
    }
];

// Service Implementation (LEGACY - aplikasi sekarang menggunakan ApiService)
export const MockService = {
    login: async (username: string): Promise<User | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = MOCK_USERS.find(u => u.username === username);
                resolve(user);
            }, 500);
        });
    },

    getUnits: async (): Promise<Unit[]> => {
        return new Promise((resolve) => resolve([...MOCK_UNITS]));
    },

    getLogbooks: async (): Promise<LogbookEntry[]> => {
        return new Promise((resolve) => resolve([...MOCK_LOGBOOKS]));
    },

    createLogbook: async (entry: Omit<LogbookEntry, 'id' | 'created_at'>): Promise<LogbookEntry> => {
        return new Promise((resolve) => {
            const newEntry: LogbookEntry = {
                ...entry,
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                toll_parking_cost: Number(entry.toll_parking_cost) || 0,
                status: 'submitted'
            };
            MOCK_LOGBOOKS.push(newEntry);
            resolve(newEntry);
        });
    }
};
