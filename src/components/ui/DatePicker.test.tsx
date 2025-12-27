import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DatePicker from './DatePicker';

describe('DatePicker', () => {
    const defaultProps = {
        onChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render with placeholder', () => {
            render(<DatePicker {...defaultProps} placeholder="Pilih tanggal" />);
            expect(screen.getByPlaceholderText('Pilih tanggal')).toBeInTheDocument();
        });

        it('should render with label', () => {
            render(<DatePicker {...defaultProps} label="Tanggal" />);
            expect(screen.getByText('Tanggal')).toBeInTheDocument();
        });

        it('should show required indicator when required', () => {
            render(<DatePicker {...defaultProps} label="Tanggal" required />);
            expect(screen.getByText('*')).toBeInTheDocument();
        });

        it('should display formatted date when value is provided', () => {
            render(<DatePicker {...defaultProps} value="2025-12-27" />);
            expect(screen.getByDisplayValue('27/12/2025')).toBeInTheDocument();
        });

        it('should display empty when no value', () => {
            render(<DatePicker {...defaultProps} />);
            expect(screen.getByRole('textbox')).toHaveValue('');
        });
    });

    describe('Calendar Dropdown', () => {
        it('should not show calendar by default', () => {
            render(<DatePicker {...defaultProps} />);
            expect(screen.queryByText('Januari')).not.toBeInTheDocument();
        });

        it('should open calendar when input is clicked', () => {
            render(<DatePicker {...defaultProps} />);
            fireEvent.click(screen.getByRole('textbox'));
            // Should show month name in calendar header
            expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
        });

        it('should show day names in Indonesian', () => {
            render(<DatePicker {...defaultProps} />);
            fireEvent.click(screen.getByRole('textbox'));
            expect(screen.getByText('Sen')).toBeInTheDocument();
            expect(screen.getByText('Sel')).toBeInTheDocument();
            expect(screen.getByText('Min')).toBeInTheDocument();
        });

        it('should navigate to previous month', () => {
            render(<DatePicker {...defaultProps} value="2025-12-15" />);
            fireEvent.click(screen.getByRole('textbox'));

            // Click previous month button
            const buttons = screen.getAllByRole('button');
            const prevButton = buttons.find(btn => btn.querySelector('svg.lucide-chevron-left'));
            if (prevButton) fireEvent.click(prevButton);

            expect(screen.getByText('November 2025')).toBeInTheDocument();
        });

        it('should navigate to next month', () => {
            render(<DatePicker {...defaultProps} value="2025-12-15" />);
            fireEvent.click(screen.getByRole('textbox'));

            // Click next month button
            const buttons = screen.getAllByRole('button');
            const nextButton = buttons.find(btn => btn.querySelector('svg.lucide-chevron-right'));
            if (nextButton) fireEvent.click(nextButton);

            expect(screen.getByText('Januari 2026')).toBeInTheDocument();
        });
    });

    describe('Date Selection', () => {
        it('should call onChange when a date is selected', () => {
            render(<DatePicker {...defaultProps} value="2025-12-15" />);
            fireEvent.click(screen.getByRole('textbox'));

            // Click on day 20
            fireEvent.click(screen.getByText('20'));

            expect(defaultProps.onChange).toHaveBeenCalledWith('2025-12-20');
        });

        it('should close calendar after selection', () => {
            render(<DatePicker {...defaultProps} value="2025-12-15" />);
            fireEvent.click(screen.getByRole('textbox'));
            fireEvent.click(screen.getByText('20'));

            // Calendar should be closed
            expect(screen.queryByText('Desember 2025')).not.toBeInTheDocument();
        });
    });

    describe('Disabled State', () => {
        it('should not open calendar when disabled', () => {
            render(<DatePicker {...defaultProps} disabled />);
            fireEvent.click(screen.getByRole('textbox'));

            expect(screen.queryByText('Januari')).not.toBeInTheDocument();
        });

        it('should show disabled styling', () => {
            render(<DatePicker {...defaultProps} disabled />);
            expect(screen.getByRole('textbox')).toBeDisabled();
        });
    });

    describe('Min/Max Date Validation', () => {
        it('should disable dates before minDate', () => {
            render(<DatePicker {...defaultProps} value="2025-12-15" minDate="2025-12-10" />);
            fireEvent.click(screen.getByRole('textbox'));

            // Day 5 should be disabled
            const day5Button = screen.getByText('5').closest('button');
            expect(day5Button).toBeDisabled();
        });

        it('should disable dates after maxDate', () => {
            render(<DatePicker {...defaultProps} value="2025-12-15" maxDate="2025-12-20" />);
            fireEvent.click(screen.getByRole('textbox'));

            // Day 25 should be disabled
            const day25Button = screen.getByText('25').closest('button');
            expect(day25Button).toBeDisabled();
        });

        it('should allow dates within range', () => {
            render(<DatePicker {...defaultProps} value="2025-12-15" minDate="2025-12-10" maxDate="2025-12-20" />);
            fireEvent.click(screen.getByRole('textbox'));

            // Day 15 should be enabled
            const day15Button = screen.getByText('15').closest('button');
            expect(day15Button).not.toBeDisabled();
        });

        it('should not trigger onChange for disabled dates', () => {
            render(<DatePicker {...defaultProps} value="2025-12-15" minDate="2025-12-10" />);
            fireEvent.click(screen.getByRole('textbox'));

            // Click disabled day
            fireEvent.click(screen.getByText('5'));

            expect(defaultProps.onChange).not.toHaveBeenCalled();
        });
    });

    describe('Today Highlight', () => {
        it('should highlight today with different styling', () => {
            // Mock today's date
            const today = new Date();
            const todayValue = today.toISOString().split('T')[0];

            render(<DatePicker {...defaultProps} value={todayValue} />);
            fireEvent.click(screen.getByRole('textbox'));

            // Today is selected, so it should have bg-blue-600 (selected state)
            const todayButton = screen.getByText(today.getDate().toString()).closest('button');
            expect(todayButton).toHaveClass('bg-blue-600');
        });
    });
});
