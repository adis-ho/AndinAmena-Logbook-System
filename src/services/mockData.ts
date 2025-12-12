import type { LogbookEntry, Unit, User } from '../types';

// Mock Data Store
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
        start_km: 10000,
        end_km: 10150,
        total_km: 150,
        activities: 'Antar tamu VIP ke Bandara',
        fuel_cost: 150000,
        toll_cost: 25000,
        parking_cost: 10000,
        other_cost: 0,
        total_cost: 185000,
        status: 'approved',
        created_at: '2025-12-10T08:00:00Z',
    }
];

// Service Implementation
export const MockService = {
    // Auth
    login: async (username: string): Promise<User | undefined> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = MOCK_USERS.find(u => u.username === username);
                resolve(user);
            }, 500);
        });
    },

    // Units
    getUnits: async (): Promise<Unit[]> => {
        return new Promise((resolve) => resolve([...MOCK_UNITS]));
    },

    // Logbooks
    getLogbooks: async (): Promise<LogbookEntry[]> => {
        return new Promise((resolve) => resolve([...MOCK_LOGBOOKS]));
    },

    // Create Logbook
    createLogbook: async (entry: Omit<LogbookEntry, 'id' | 'created_at' | 'total_km' | 'total_cost'>): Promise<LogbookEntry> => {
        return new Promise((resolve) => {
            const newEntry: LogbookEntry = {
                ...entry,
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                start_km: Number(entry.start_km),
                end_km: Number(entry.end_km),
                total_km: Number(entry.end_km) - Number(entry.start_km),
                total_cost: (Number(entry.fuel_cost) || 0) + (Number(entry.toll_cost) || 0) + (Number(entry.parking_cost) || 0) + (Number(entry.other_cost) || 0),
                status: 'draft' // Default status
            };
            MOCK_LOGBOOKS.push(newEntry);
            resolve(newEntry);
        });
    }
};
