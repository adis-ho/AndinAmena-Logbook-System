import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from './DateRangePicker';

describe('DateRangePicker', () => {
    const defaultProps = {
        onChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render two date inputs', () => {
            render(<DateRangePicker {...defaultProps} />);
            const inputs = screen.getAllByRole('textbox');
            expect(inputs).toHaveLength(2);
        });

        it('should render separator text', () => {
            render(<DateRangePicker {...defaultProps} />);
            expect(screen.getByText('s/d')).toBeInTheDocument();
        });

        it('should display start date value', () => {
            render(<DateRangePicker {...defaultProps} startDate="2025-12-01" />);
            expect(screen.getByDisplayValue('01/12/2025')).toBeInTheDocument();
        });

        it('should display end date value', () => {
            render(<DateRangePicker {...defaultProps} endDate="2025-12-31" />);
            expect(screen.getByDisplayValue('31/12/2025')).toBeInTheDocument();
        });

        it('should display both dates when provided', () => {
            render(<DateRangePicker {...defaultProps} startDate="2025-12-01" endDate="2025-12-31" />);
            expect(screen.getByDisplayValue('01/12/2025')).toBeInTheDocument();
            expect(screen.getByDisplayValue('31/12/2025')).toBeInTheDocument();
        });
    });

    describe('Date Selection', () => {
        it('should call onChange with start date when start picker is used', () => {
            render(<DateRangePicker {...defaultProps} startDate="2025-12-15" endDate="2025-12-20" />);

            // Click first input (start date)
            const inputs = screen.getAllByRole('textbox');
            fireEvent.click(inputs[0]);

            // Select a day
            fireEvent.click(screen.getByText('10'));

            expect(defaultProps.onChange).toHaveBeenCalledWith('2025-12-10', '2025-12-20');
        });

        it('should call onChange with end date when end picker is used', () => {
            render(<DateRangePicker {...defaultProps} startDate="2025-12-15" endDate="2025-12-20" />);

            // Click second input (end date)
            const inputs = screen.getAllByRole('textbox');
            fireEvent.click(inputs[1]);

            // Select a day
            fireEvent.click(screen.getByText('25'));

            expect(defaultProps.onChange).toHaveBeenCalledWith('2025-12-15', '2025-12-25');
        });
    });

    describe('Range Validation', () => {
        it('should pass maxDate to start picker based on end date', () => {
            render(<DateRangePicker {...defaultProps} startDate="2025-12-10" endDate="2025-12-20" />);

            // Open start date picker
            const inputs = screen.getAllByRole('textbox');
            fireEvent.click(inputs[0]);

            // Day 25 should be disabled (after end date)
            const day25Button = screen.getByText('25').closest('button');
            expect(day25Button).toBeDisabled();
        });

        it('should pass minDate to end picker based on start date', () => {
            render(<DateRangePicker {...defaultProps} startDate="2025-12-15" endDate="2025-12-20" />);

            // Open end date picker
            const inputs = screen.getAllByRole('textbox');
            fireEvent.click(inputs[1]);

            // Day 10 should be disabled (before start date)
            const day10Button = screen.getByText('10').closest('button');
            expect(day10Button).toBeDisabled();
        });
    });

    describe('Responsive Layout', () => {
        it('should have responsive flex classes', () => {
            const { container } = render(<DateRangePicker {...defaultProps} />);
            const wrapper = container.firstChild;
            expect(wrapper).toHaveClass('flex-col', 'sm:flex-row');
        });
    });

    describe('Custom className', () => {
        it('should apply custom className', () => {
            const { container } = render(<DateRangePicker {...defaultProps} className="custom-class" />);
            expect(container.firstChild).toHaveClass('custom-class');
        });
    });
});
