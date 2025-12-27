import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { Etoll } from '../../types';
import { Plus, Pencil, Trash2, CreditCard, X, Wallet } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SkeletonManagementList } from '../../components/ui/Skeleton';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import Select from '../../components/ui/Select';

type FormMode = 'add' | 'edit' | null;

export default function EtollList() {
    const { showToast } = useToast();
    const [etolls, setEtolls] = useState<Etoll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formMode, setFormMode] = useState<FormMode>(null);
    const [editingEtoll, setEditingEtoll] = useState<Etoll | null>(null);
    const [formData, setFormData] = useState({
        card_name: '',
        card_number: '',
        balance: 0,
        status: 'active' as Etoll['status']
    });
    const [formLoading, setFormLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; etollId: string }>({
        isOpen: false,
        etollId: ''
    });

    const fetchEtolls = async () => {
        try {
            const data = await ApiService.getEtolls();
            setEtolls(data);
        } catch (err) {
            setError('Gagal memuat data E-Toll');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEtolls();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const resetForm = () => {
        setFormData({ card_name: '', card_number: '', balance: 0, status: 'active' });
        setFormMode(null);
        setEditingEtoll(null);
    };

    const handleAdd = () => {
        resetForm();
        setFormMode('add');
    };

    const handleEdit = (etoll: Etoll) => {
        setEditingEtoll(etoll);
        setFormData({
            card_name: etoll.card_name,
            card_number: etoll.card_number || '',
            balance: etoll.balance,
            status: etoll.status
        });
        setFormMode('edit');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (formMode === 'add') {
                await ApiService.createEtoll(formData);
                showToast('success', 'Kartu E-Toll berhasil ditambahkan');
            } else if (formMode === 'edit' && editingEtoll) {
                await ApiService.updateEtoll(editingEtoll.id, formData);
                showToast('success', 'Kartu E-Toll berhasil diupdate');
            }
            resetForm();
            fetchEtolls();
        } catch (err) {
            showToast('error', formMode === 'add' ? 'Gagal menambah E-Toll' : 'Gagal mengupdate E-Toll');
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteModal({ isOpen: true, etollId: id });
    };

    const executeDelete = async () => {
        if (!deleteModal.etollId) return;
        setFormLoading(true);

        try {
            await ApiService.deleteEtoll(deleteModal.etollId);
            setEtolls(etolls.filter(e => e.id !== deleteModal.etollId));
            showToast('success', 'Kartu E-Toll berhasil dihapus');
            setDeleteModal({ ...deleteModal, isOpen: false });
        } catch (err) {
            showToast('error', 'Gagal menghapus E-Toll');
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    const getStatusBadge = (status: Etoll['status']) => {
        const styles: Record<Etoll['status'], string> = {
            active: 'bg-green-100 text-green-700',
            inactive: 'bg-gray-100 text-gray-700'
        };
        const labels: Record<Etoll['status'], string> = {
            active: 'Aktif',
            inactive: 'Nonaktif'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    if (loading) {
        return <SkeletonManagementList />;
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen E-Toll</h1>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 p-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="h-5 w-5 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Tambah E-Toll</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Kartu</p>
                            <p className="text-xl font-bold text-gray-900">{etolls.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <Wallet className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Saldo</p>
                            <p className="text-xl font-bold text-green-600">
                                {formatCurrency(etolls.reduce((sum, e) => sum + e.balance, 0))}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-lg">
                            <CreditCard className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Kartu Aktif</p>
                            <p className="text-xl font-bold text-gray-900">
                                {etolls.filter(e => e.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {formMode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                {formMode === 'add' ? 'Tambah Kartu E-Toll' : 'Edit Kartu E-Toll'}
                            </h2>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Kartu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Contoh: Mandiri E-Toll #1"
                                    value={formData.card_name}
                                    onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nomor Kartu (Opsional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Contoh: 1234567890"
                                    value={formData.card_number}
                                    onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Saldo (Rp)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                    value={formData.balance || ''}
                                    onChange={(e) => setFormData({ ...formData, balance: Math.round(Number(e.target.value)) || 0 })}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Preview: {formatCurrency(formData.balance)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <Select
                                    value={formData.status}
                                    onChange={(val) => setFormData({ ...formData, status: val as Etoll['status'] })}
                                    options={[
                                        { value: 'active', label: 'Aktif' },
                                        { value: 'inactive', label: 'Nonaktif' }
                                    ]}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {formLoading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* E-Toll List - Desktop Table */}
            {etolls.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Belum ada kartu E-Toll</p>
                    <button
                        onClick={handleAdd}
                        className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        + Tambah Kartu E-Toll
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop Table - Hidden on mobile */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Nama Kartu</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Nomor</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Saldo</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {etolls.map(etoll => (
                                    <tr key={etoll.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                    <CreditCard className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">{etoll.card_name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">{etoll.card_number || '-'}</td>
                                        <td className="py-3 px-4 text-right">
                                            <span className={`font-bold ${etoll.balance < 50000 ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatCurrency(etoll.balance)}
                                            </span>
                                            {etoll.balance < 50000 && (
                                                <p className="text-xs text-red-500">Saldo rendah!</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">{getStatusBadge(etoll.status)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(etoll)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(etoll.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards - Show on mobile only */}
                    <div className="md:hidden space-y-3">
                        {etolls.map(etoll => (
                            <div key={etoll.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <CreditCard className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{etoll.card_name}</p>
                                            <p className="text-sm text-gray-500">{etoll.card_number || '-'}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(etoll.status)}
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-gray-500">Saldo</span>
                                    <div className="text-right">
                                        <span className={`font-bold text-lg ${etoll.balance < 50000 ? 'text-red-600' : 'text-green-600'}`}>
                                            {formatCurrency(etoll.balance)}
                                        </span>
                                        {etoll.balance < 50000 && <p className="text-xs text-red-500">Saldo rendah!</p>}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                    <button onClick={() => handleEdit(etoll)} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium">Edit</button>
                                    <button onClick={() => handleDeleteClick(etoll.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium">Hapus</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={executeDelete}
                title="Hapus E-Toll?"
                description="Apakah Anda yakin ingin menghapus kartu E-Toll ini?"
                confirmText="Hapus"
                cancelText="Batal"
                loading={formLoading}
            />
        </div>
    );
}
