import { useEffect, useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import type { Unit } from '../../types';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SkeletonManagementList } from '../../components/ui/Skeleton';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import Select from '../../components/ui/Select';
import { queryKeys } from '../../lib/queryKeys';

type FormMode = 'add' | 'edit' | null;

export default function UnitList() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [units, setUnits] = useState<Unit[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formMode, setFormMode] = useState<FormMode>(null);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        plate_number: '',
        status: 'available' as Unit['status']
    });
    const [formLoading, setFormLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; unitId: string }>({
        isOpen: false,
        unitId: ''
    });

    const modalRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const fetchUnits = async () => {
        try {
            const data = await ApiService.getUnits();
            setUnits(data);
        } catch (err) {
            setError('Gagal memuat data unit');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    // Focus trapping, Escape key, and body scroll lock for modal
    useEffect(() => {
        if (!formMode) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const timer = setTimeout(() => {
            nameInputRef.current?.focus();
        }, 50);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                resetForm();
                return;
            }

            if (e.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            clearTimeout(timer);
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [formMode]);

    const filteredUnits = useMemo(() => {
        if (!searchQuery.trim()) return units;
        const q = searchQuery.toLowerCase().trim();
        return units.filter(
            u => u.name.toLowerCase().includes(q) || u.plate_number.toLowerCase().includes(q)
        );
    }, [units, searchQuery]);

    const resetForm = () => {
        setFormData({ name: '', plate_number: '', status: 'available' });
        setFormMode(null);
        setEditingUnit(null);
    };

    const handleAdd = () => {
        resetForm();
        setFormMode('add');
    };

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setFormData({
            name: unit.name,
            plate_number: unit.plate_number,
            status: unit.status
        });
        setFormMode('edit');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanedPlate = formData.plate_number.trim().toUpperCase();
        const cleanedName = formData.name.trim();

        if (!cleanedName || !cleanedPlate) {
            showToast('warning', 'Nama unit dan plat nomor wajib diisi');
            return;
        }

        // Client-side pre-validation: check duplicate plate number
        const normalizedPlateInput = cleanedPlate.replace(/\s+/g, '');
        const isDuplicate = units.some(
            u =>
                u.plate_number.replace(/\s+/g, '').toUpperCase() === normalizedPlateInput &&
                (formMode === 'add' || u.id !== editingUnit?.id)
        );

        if (isDuplicate) {
            showToast('error', `Gagal: Plat nomor "${cleanedPlate}" sudah terdaftar pada unit lain.`);
            return;
        }

        setFormLoading(true);

        const payload = {
            name: cleanedName,
            plate_number: cleanedPlate,
            status: formData.status
        };

        try {
            if (formMode === 'add') {
                await ApiService.createUnit(payload);
            } else if (formMode === 'edit' && editingUnit) {
                await ApiService.updateUnit(editingUnit.id, payload);
            }
            showToast('success', formMode === 'add' ? 'Unit berhasil ditambahkan' : 'Unit berhasil diupdate');
            resetForm();
            fetchUnits();
            await queryClient.invalidateQueries({ queryKey: queryKeys.units });
        } catch (err: any) {
            const isUniqueViolation =
                err?.code === '23505' ||
                err?.message?.includes('duplicate key') ||
                err?.message?.includes('unique constraint') ||
                err?.message?.includes('units_plate_number_key');

            if (isUniqueViolation) {
                showToast('error', `Gagal: Plat nomor "${cleanedPlate}" sudah terdaftar pada unit lain.`);
            } else {
                showToast(
                    'error',
                    `${formMode === 'add' ? 'Gagal menambah unit' : 'Gagal mengupdate unit'}: ${
                        err?.message || 'Terjadi kesalahan sistem'
                    }`
                );
            }
            console.error('[UnitList] Submit error:', err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteModal({ isOpen: true, unitId: id });
    };

    const executeDelete = async () => {
        if (!deleteModal.unitId) return;
        setFormLoading(true);

        try {
            await ApiService.deleteUnit(deleteModal.unitId);
            setUnits(units.filter(u => u.id !== deleteModal.unitId));
            await queryClient.invalidateQueries({ queryKey: queryKeys.units });
            showToast('success', 'Unit berhasil dihapus');
            setDeleteModal({ ...deleteModal, isOpen: false });
        } catch (err: any) {
            const message = err.message || 'Gagal menghapus unit';
            if (message.includes('foreign key constraint') || message.includes('violates foreign key')) {
                showToast('error', 'Gagal: Unit ini memiliki riwayat Logbook / digunakan. Hapus logbook terkait terlebih dahulu.');
            } else {
                showToast('error', `Gagal menghapus unit: ${message}`);
            }
            console.error('Delete unit error:', err);
        } finally {
            setFormLoading(false);
        }
    };

    const getStatusBadge = (status: Unit['status']) => {
        const styles: Record<Unit['status'], string> = {
            available: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            'in-use': 'bg-blue-50 text-blue-700 border-blue-200/80',
            maintenance: 'bg-rose-50 text-rose-700 border-rose-200/80'
        };
        const labels: Record<Unit['status'], string> = {
            available: 'Tersedia',
            'in-use': 'Digunakan',
            maintenance: 'Maintenance'
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    if (loading) {
        return <SkeletonManagementList />;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Manajemen Unit</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola armada kendaraan operasional</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[44px]"
                >
                    <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    <span>Tambah Unit</span>
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" aria-hidden="true" />
                        <p>{error}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setError('')}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors"
                        aria-label="Tutup pesan error"
                    >
                        <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    </button>
                </div>
            )}

            {/* Modal Form */}
            {formMode && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-modal-backdrop"
                    style={{ overscrollBehavior: 'contain' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) resetForm();
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                >
                    <div
                        ref={modalRef}
                        className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] animate-modal-content"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
                            <div>
                                <h2 id="modal-title" className="text-lg font-bold text-gray-900">
                                    {formMode === 'add' ? 'Tambah Unit Baru' : 'Edit Unit'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {formMode === 'add' ? 'Lengkapi informasi kendaraan operasional' : 'Perbarui data armada kendaraan'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                aria-label="Tutup modal"
                            >
                                <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div>
                                    <label htmlFor="unit_name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Nama Unit <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        ref={nameInputRef}
                                        id="unit_name"
                                        type="text"
                                        required
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Contoh: Avanza 1"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="plate_number" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Plat Nomor <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="plate_number"
                                        type="text"
                                        required
                                        spellCheck={false}
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 tabular-nums focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
                                        value={formData.plate_number}
                                        onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                                        placeholder="Contoh: B 1234 ABC"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Status Operasional <span className="text-rose-500">*</span>
                                    </label>
                                    <Select
                                        value={formData.status}
                                        onChange={(val) => setFormData({ ...formData, status: val as Unit['status'] })}
                                        options={[
                                            { value: 'available', label: 'Tersedia' },
                                            { value: 'in-use', label: 'Digunakan' },
                                            { value: 'maintenance', label: 'Maintenance' }
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 bg-gray-50/50 border-t border-gray-100 shrink-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 bg-white font-semibold text-sm rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm min-h-[44px]"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
                                    >
                                        {formLoading ? (
                                            <>
                                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                                                <span>Menyimpan...</span>
                                            </>
                                        ) : 'Simpan Data'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Search Bar Area */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={1.5} aria-hidden="true" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama unit atau plat nomor..."
                        className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                            aria-label="Hapus pencarian"
                        >
                            <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        </button>
                    )}
                </div>
                <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 self-end sm:self-center">
                    <span>Menampilkan:</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                        {filteredUnits.length} dari {units.length} unit
                    </span>
                </div>
            </div>

            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-100">
                                <th scope="col" className="text-left py-3.5 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500 w-1/2">Identitas Unit</th>
                                <th scope="col" className="text-center py-3.5 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500">Status</th>
                                <th scope="col" className="text-right py-3.5 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUnits.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {searchQuery ? 'Unit tidak ditemukan' : 'Belum ada data unit'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 mb-4">
                                                {searchQuery
                                                    ? `Tidak ada armada yang cocok dengan "${searchQuery}"`
                                                    : 'Tambahkan unit operasional baru untuk memulai.'}
                                            </p>
                                            {!searchQuery && (
                                                <button
                                                    onClick={handleAdd}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-[0.98] rounded-lg transition-all"
                                                >
                                                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                                                    <span>Tambah Unit</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUnits.map(unit => (
                                    <tr key={unit.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className={`flex items-center gap-3.5 ${unit.status === 'maintenance' ? 'opacity-60' : ''}`}>
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 font-bold text-xs text-slate-700 uppercase">
                                                    {unit.name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-sm">{unit.name}</p>
                                                    <p className="text-xs text-slate-500 tabular-nums font-medium tracking-wide">{unit.plate_number}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {getStatusBadge(unit.status)}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleEdit(unit)}
                                                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 active:scale-95 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                                    aria-label={`Edit unit ${unit.name}`}
                                                >
                                                    <Pencil className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(unit.id)}
                                                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                                    aria-label={`Hapus unit ${unit.name}`}
                                                >
                                                    <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards - Show on mobile only */}
            <div className="md:hidden space-y-3">
                {filteredUnits.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-10 px-6 text-center">
                        <p className="text-sm font-semibold text-gray-900">
                            {searchQuery ? 'Unit tidak ditemukan' : 'Belum ada unit'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 mb-4">
                            {searchQuery
                                ? `Tidak ada armada yang cocok dengan "${searchQuery}"`
                                : 'Tambahkan unit operasional baru untuk memulai.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={handleAdd}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-[0.98] rounded-lg transition-all"
                            >
                                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                                <span>Tambah Unit</span>
                            </button>
                        )}
                    </div>
                ) : (
                    filteredUnits.map(unit => (
                        <div
                            key={unit.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200/70 p-4 flex flex-col gap-3 transition-shadow"
                        >
                            {/* Card Header & Identity */}
                            <div className="flex items-start justify-between gap-3">
                                <div className={`flex items-center gap-3 ${unit.status === 'maintenance' ? 'opacity-60' : ''}`}>
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 font-bold text-xs text-slate-700 uppercase">
                                        {unit.name.substring(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 tracking-tight">{unit.name}</h3>
                                        <p className="text-xs font-semibold text-slate-500 tabular-nums tracking-wide">{unit.plate_number}</p>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    {getStatusBadge(unit.status)}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-100" />

                            {/* Action Buttons with 44px min touch target */}
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => handleEdit(unit)}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] text-gray-700 rounded-xl font-semibold text-xs tracking-wide transition-all border border-gray-200/60 min-h-[44px]"
                                    aria-label={`Edit unit ${unit.name}`}
                                >
                                    <Pencil className="h-3.5 w-3.5 text-gray-500" strokeWidth={1.5} aria-hidden="true" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(unit.id)}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 active:scale-[0.98] text-rose-700 rounded-xl font-semibold text-xs tracking-wide transition-all border border-rose-200/60 min-h-[44px]"
                                    aria-label={`Hapus unit ${unit.name}`}
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-rose-600" strokeWidth={1.5} aria-hidden="true" />
                                    <span>Hapus</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={executeDelete}
                title="Hapus Unit Operasional?"
                description="Tindakan ini tidak dapat dibatalkan. Menghapus unit akan gagal jika unit masih terikat dengan data logbook atau laporan pengeluaran."
                confirmText="Hapus Unit"
                cancelText="Batal"
                loading={formLoading}
            />
        </div>
    );
}
