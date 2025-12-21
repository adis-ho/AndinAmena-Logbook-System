import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmModal from './DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn(),
        title: 'Test Title',
        description: 'Test Description',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(<DeleteConfirmModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
        render(<DeleteConfirmModal {...defaultProps} />);
        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('should display warning text when provided', () => {
        render(<DeleteConfirmModal {...defaultProps} warningText="This is a warning" />);
        expect(screen.getByText('Peringatan')).toBeInTheDocument();
        expect(screen.getByText('This is a warning')).toBeInTheDocument();
    });

    it('should not display warning box when warningText is not provided', () => {
        render(<DeleteConfirmModal {...defaultProps} />);
        expect(screen.queryByText('Peringatan')).not.toBeInTheDocument();
    });

    it('should call onClose when cancel button is clicked', () => {
        render(<DeleteConfirmModal {...defaultProps} cancelText="Batal" />);
        fireEvent.click(screen.getByText('Batal'));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when confirm button is clicked', () => {
        render(<DeleteConfirmModal {...defaultProps} confirmText="Hapus" />);
        fireEvent.click(screen.getByText('Hapus'));
        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when X button is clicked', () => {
        render(<DeleteConfirmModal {...defaultProps} />);
        // X button is the first button in the modal header
        const closeButton = screen.getByRole('button', { name: '' });
        fireEvent.click(closeButton);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when loading is true', () => {
        render(<DeleteConfirmModal {...defaultProps} loading={true} />);
        expect(screen.getByText('Memproses...')).toBeInTheDocument();
    });

    it('should disable buttons when loading', () => {
        render(<DeleteConfirmModal {...defaultProps} loading={true} cancelText="Batal" />);
        const cancelButton = screen.getByText('Batal').closest('button');
        const confirmButton = screen.getByText('Memproses...').closest('button');
        expect(cancelButton).toBeDisabled();
        expect(confirmButton).toBeDisabled();
    });

    it('should use default button text when not provided', () => {
        render(<DeleteConfirmModal {...defaultProps} />);
        expect(screen.getByText('Ya, hapus permanen')).toBeInTheDocument();
        expect(screen.getByText('Tidak, batalkan')).toBeInTheDocument();
    });

    it('should use custom button text when provided', () => {
        render(
            <DeleteConfirmModal
                {...defaultProps}
                confirmText="Delete Now"
                cancelText="Cancel"
            />
        );
        expect(screen.getByText('Delete Now')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
});
