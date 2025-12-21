/**
 * Application Constants
 * Centralized configuration for magic numbers and settings
 */

// Pagination
export const PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Authentication
export const MIN_PASSWORD_LENGTH = 6;

// Date/Time
export const NOTIFICATION_RETENTION_DAYS = 30;

// Currency
export const CURRENCY_LOCALE = 'id-ID';
export const CURRENCY_CODE = 'IDR';

// API
export const API_RETRY_COUNT = 3;
export const API_TIMEOUT_MS = 30000;

// UI
export const TOAST_DURATION_MS = 5000;
export const DEBOUNCE_DELAY_MS = 300;

// Status values
export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
} as const;

export const LOGBOOK_STATUS = {
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected'
} as const;

export const UNIT_STATUS = {
    AVAILABLE: 'available',
    IN_USE: 'in-use',
    MAINTENANCE: 'maintenance'
} as const;

export const ETOLL_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive'
} as const;
