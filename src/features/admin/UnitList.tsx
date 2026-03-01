import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import type { Unit } from '../../types';
import { Plus, Pencil, Trash2, Truck, X } from 'lucide-react';
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
        setFormLoading(true);

        try {
            if (formMode === 'add') {
                await ApiService.createUnit(formData);
            } else if (formMode === 'edit' && editingUnit) {
                await ApiService.updateUnit(editingUnit.id, formData);
            }
            showToast('success', formMode === 'add' ? 'Unit berhasil ditambahkan' : 'Unit berhasil diupdate');
            resetForm();
            fetchUnits();
            await queryClient.invalidateQueries({ queryKey: queryKeys.units });
        } catch (err) {
            showToast('error', formMode === 'add' ? 'Gagal menambah unit' : 'Gagal mengupdate unit');
            console.error(err);
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
            // Check for foreign key violation (Postgres error 23503)
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
            available: 'bg-emerald-50 text-emerald-600 border-emerald-200/60 shadow-sm shadow-emerald-100/50',
            'in-use': 'bg-blue-50 text-blue-600 border-blue-200/60 shadow-sm shadow-blue-100/50',
            maintenance: 'bg-rose-50 text-rose-600 border-rose-200/60 shadow-sm shadow-rose-100/50 opacity-90'
        };
        const labels: Record<Unit['status'], string> = {
            available: 'Tersedia',
            'in-use': 'Digunakan',
            maintenance: 'Maintenance'
        };
        return (
            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />
                <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center shadow-sm">
                        <Truck className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Unit</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Kelola armada kendaraan operasional</p>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="relative flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide hover:shadow-lg hover:shadow-blue-500/25 transition duration-300 hover:-translate-y-0.5"
                >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                    <span>Tambah Unit</span>
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full shrink-0 shadow-sm">
                        <X className="h-4 w-4 text-rose-500" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            {/* Modal Form */}
            {formMode && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    style={{ overscrollBehavior: 'contain' }}
                >
                    <div className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl border border-white/20 overflow-hidden transform transition flex flex-col max-h-[calc(100vh-2rem)]">
                        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6 relative shrink-0">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors bg-white rounded-full p-1 border border-gray-100 shadow-sm"
                                aria-label="Tutup form"
                            >
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">
                                {formMode === 'add' ? 'Tambah Unit Baru' : 'Edit Unit'}
                            </h2>
                            <p className="text-xs font-bold text-gray-400 mt-1.5 uppercase tracking-wider">
                                {formMode === 'add' ? 'Lengkapi data kendaraan' : 'Perbarui armada'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                            <div className="p-6 space-y-5 bg-white overflow-y-auto">
                                <div>
                                    <label htmlFor="unit_name" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nama Unit *</label>
                                    <input
                                        id="unit_name"
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 outline-none placeholder:text-gray-400"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Contoh: Avanza 1…"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="plate_number" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Plat Nomor *</label>
                                    <input
                                        id="plate_number"
                                        type="text"
                                        required
                                        spellCheck={false}
                                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 tabular-nums outline-none placeholder:text-gray-400"
                                        value={formData.plate_number}
                                        onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                                        placeholder="Contoh: B 1234 ABC…"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Status *</label>
                                    <div className="relative">
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
                            </div>

                            <div className="p-6 bg-gray-50/50 border-t border-gray-100 shrink-0">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 bg-white font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {formLoading ? (
                                            <>
                                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                                Menyimpan…
                                            </>
                                        ) : 'Simpan Data'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none w-1/2">Identitas Unit</th>
                                <th className="text-center py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none">Status</th>
                                <th className="text-right py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {units.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="py-12 border-none">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 shadow-sm">
                                                <Truck className="h-8 w-8 text-gray-300" aria-hidden="true" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">Belum ada data unit</p>
                                            <p className="text-xs font-medium text-gray-500 mt-1">Tambahkan unit operasional baru.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                units.map(unit => (
                                    <tr key={unit.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                        <td className="py-4 px-6 border-none">
                                            <div className={`flex items-center gap-4 transition-opacity ${unit.status === 'maintenance' ? 'opacity-50' : ''}`}>
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-white flex items-center justify-center shadow-sm shrink-0 ring-1 ring-slate-900/5">
                                                    <Truck className="h-4 w-4 text-slate-500" aria-hidden="true" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{unit.name}</p>
                                                    <p className="text-[13px] font-medium text-gray-500 tabular-nums tracking-wide">{unit.plate_number}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center border-none">
                                            {getStatusBadge(unit.status)}
                                        </td>
                                        <td className="py-4 px-6 text-right border-none">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={() => handleEdit(unit)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                    aria-label={`Edit unit ${unit.name}`}
                                                >
                                                    <Pencil className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(unit.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                    aria-label={`Hapus unit ${unit.name}`}
                                                >
                                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
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
            <div className="md:hidden space-y-4">
                {units.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-10 px-6 text-center">
                        <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Truck className="h-8 w-8 text-gray-300" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-bold text-gray-900">Belum ada unit</p>
                    </div>
                ) : (
                    units.map(unit => (
                        <div key={unit.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`flex items-start gap-4 transition-opacity ${unit.status === 'maintenance' ? 'opacity-50' : ''}`}>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-white flex items-center justify-center shadow-sm shrink-0 ring-1 ring-slate-900/5">
                                        <Truck className="h-4 w-4 text-slate-500" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm mb-0.5">{unit.name}</p>
                                        <p className="text-xs font-medium text-gray-500 tabular-nums tracking-wide mb-2">{unit.plate_number}</p>
                                        {getStatusBadge(unit.status)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => handleEdit(unit)}
                                    className="px-4 py-2 text-blue-600 bg-blue-50/50 hover:bg-blue-50 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(unit.id)}
                                    className="px-4 py-2 text-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors"
                                >
                                    Hapus
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
