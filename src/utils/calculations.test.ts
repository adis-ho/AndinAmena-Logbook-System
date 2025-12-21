import { describe, it, expect } from 'vitest';

/**
 * Utility function tests
 */

// Helper function to format currency (mirrors app logic)
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

describe('formatCurrency', () => {
    it('should format zero correctly', () => {
        const result = formatCurrency(0);
        expect(result).toMatch(/Rp\s*0/);
    });

    it('should format positive numbers with thousand separators', () => {
        const result1 = formatCurrency(100000);
        const result2 = formatCurrency(1500000);
        expect(result1).toMatch(/Rp\s*100\.000/);
        expect(result2).toMatch(/Rp\s*1\.500\.000/);
    });

    it('should format negative numbers', () => {
        const result = formatCurrency(-50000);
        expect(result).toMatch(/-Rp\s*50\.000/);
    });

    it('should handle large numbers', () => {
        const result = formatCurrency(999999999);
        expect(result).toMatch(/Rp\s*999\.999\.999/);
    });
});

/**
 * Balance calculation tests
 */
describe('Operational Balance Calculations', () => {
    const calculateNewBalance = (currentBalance: number, topUpAmount: number): number => {
        return currentBalance + topUpAmount;
    };

    const deductBalance = (currentBalance: number, operationalCost: number): number => {
        return Math.max(0, currentBalance - operationalCost);
    };

    describe('Top-up Balance', () => {
        it('should add amount to current balance', () => {
            expect(calculateNewBalance(100000, 50000)).toBe(150000);
        });

        it('should work with zero initial balance', () => {
            expect(calculateNewBalance(0, 100000)).toBe(100000);
        });
    });

    describe('Deduct Balance', () => {
        it('should subtract cost from balance', () => {
            expect(deductBalance(100000, 30000)).toBe(70000);
        });

        it('should not go below zero', () => {
            expect(deductBalance(50000, 100000)).toBe(0);
        });

        it('should handle exact deduction', () => {
            expect(deductBalance(100000, 100000)).toBe(0);
        });
    });
});

/**
 * Logbook Status Flow Tests
 */
describe('Logbook Status Flow', () => {
    type LogbookStatus = 'submitted' | 'approved' | 'rejected';

    const isValidTransition = (from: LogbookStatus, to: LogbookStatus): boolean => {
        const validTransitions: Record<LogbookStatus, LogbookStatus[]> = {
            submitted: ['approved', 'rejected'],
            approved: [], // Final state
            rejected: [], // Final state
        };
        return validTransitions[from].includes(to);
    };

    it('should allow transition from submitted to approved', () => {
        expect(isValidTransition('submitted', 'approved')).toBe(true);
    });

    it('should allow transition from submitted to rejected', () => {
        expect(isValidTransition('submitted', 'rejected')).toBe(true);
    });

    it('should not allow transition from approved to any state', () => {
        expect(isValidTransition('approved', 'submitted')).toBe(false);
        expect(isValidTransition('approved', 'rejected')).toBe(false);
    });

    it('should not allow transition from rejected to any state', () => {
        expect(isValidTransition('rejected', 'submitted')).toBe(false);
        expect(isValidTransition('rejected', 'approved')).toBe(false);
    });
});

/**
 * Cost Calculation Tests
 */
describe('Logbook Cost Calculations', () => {
    interface LogbookCosts {
        toll_cost: number;
        operational_cost: number;
    }

    const calculateTotalCost = (logbook: LogbookCosts): number => {
        return logbook.toll_cost + logbook.operational_cost;
    };

    const calculateGrandTotal = (logbooks: LogbookCosts[]): number => {
        return logbooks.reduce((sum, log) => sum + calculateTotalCost(log), 0);
    };

    it('should calculate total cost per logbook', () => {
        expect(calculateTotalCost({ toll_cost: 25000, operational_cost: 15000 })).toBe(40000);
    });

    it('should handle zero costs', () => {
        expect(calculateTotalCost({ toll_cost: 0, operational_cost: 0 })).toBe(0);
    });

    it('should calculate grand total for multiple logbooks', () => {
        const logbooks: LogbookCosts[] = [
            { toll_cost: 25000, operational_cost: 15000 },
            { toll_cost: 30000, operational_cost: 10000 },
            { toll_cost: 20000, operational_cost: 5000 },
        ];
        expect(calculateGrandTotal(logbooks)).toBe(105000);
    });

    it('should return 0 for empty array', () => {
        expect(calculateGrandTotal([])).toBe(0);
    });
});
