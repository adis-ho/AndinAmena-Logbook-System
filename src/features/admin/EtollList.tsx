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

    // Top Up State
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [topUpEtoll, setTopUpEtoll] = useState<Etoll | null>(null);
    const [topUpAmount, setTopUpAmount] = useState<number>(0);
    const [topUpLoading, setTopUpLoading] = useState(false);

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

    const handleOpenTopUp = (etoll: Etoll) => {
        setTopUpEtoll(etoll);
        setTopUpAmount(0);
        setShowTopUpModal(true);
    };

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topUpEtoll || topUpAmount <= 0) {
            showToast('error', 'Jumlah harus lebih dari 0');
            return;
        }

        setTopUpLoading(true);
        try {
            await ApiService.topUpEtollBalance(topUpEtoll.id, topUpAmount);
            showToast('success', `Berhasil top-up ${formatCurrency(topUpAmount)} untuk E-Toll ${topUpEtoll.card_name}`);
            setShowTopUpModal(false);
            setTopUpEtoll(null);
            setTopUpAmount(0);
            fetchEtolls();
        } catch (err) {
            showToast('error', 'Gagal melakukan top-up E-Toll');
            console.error(err);
        } finally {
            setTopUpLoading(false);
        }
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
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />
                <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center shadow-sm">
                        <CreditCard className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen E-Toll</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Kelola data dan saldo kartu E-Toll operasional</p>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="relative flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 z-10"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>Tambah E-Toll</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
                    <div className="flex items-center gap-3 mb-4 relative">
                        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100/50 shadow-sm text-blue-600">
                            <CreditCard className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-tight">Total<br />Kartu Terdaftar</p>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tabular-nums tracking-tight relative">{etolls.length}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl border border-emerald-400 relative overflow-hidden group hover:shadow-md transition-all shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500 blur-sm" />
                    <div className="flex items-center gap-3 mb-4 relative text-emerald-50">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
                            <Wallet className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 leading-tight">Total Akumulasi<br />Saldo Cepat</p>
                    </div>
                    <p className="text-3xl font-black text-white tabular-nums tracking-tight relative">
                        {formatCurrency(etolls.reduce((sum, e) => sum + e.balance, 0))}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 relative overflow-hidden group hover:border-amber-200 transition-colors shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
                    <div className="flex items-center gap-3 mb-4 relative">
                        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100/50 shadow-sm text-amber-600">
                            <CreditCard className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-tight">Aktif Digunakan<br />Tersedia</p>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tabular-nums tracking-tight relative">
                        {etolls.filter(e => e.status === 'active').length}
                    </p>
                </div>
            </div>

            {/* Desktop Table List */}
            {etolls.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center group">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm group-hover:scale-110 transition-transform">
                        <CreditCard className="h-8 w-8 text-gray-300" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Belum ada kartu E-Toll</p>
                    <p className="text-xs text-gray-500 mb-5">Tambahkan info kartu untuk mulai memantau saldo.</p>
                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Tambah Kartu E-Toll
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop View */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
                            <h2 className="text-sm font-bold text-gray-900">Tabel Inventaris E-Toll</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none w-2/5">Identitas Kartu</th>
                                        <th className="text-right py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none">Saldo Berjalan</th>
                                        <th className="text-center py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none">Status</th>
                                        <th className="text-right py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none w-32">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {etolls.map(etoll => (
                                        <tr key={etoll.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                            <td className="py-4 px-6 border-none">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm ring-1 ring-slate-900/5 flex items-center justify-center shrink-0">
                                                        <CreditCard className="h-4 w-4 text-slate-500" aria-hidden="true" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{etoll.card_name}</p>
                                                        <p className="text-[11px] font-medium text-gray-400 mt-0.5">{etoll.card_number || 'Tanpa nomor seri'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right border-none">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-[15px] font-black tabular-nums tracking-tight ${etoll.balance < 50000 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {formatCurrency(etoll.balance)}
                                                    </span>
                                                    {etoll.balance < 50000 && (
                                                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 rounded text-[9px] font-bold uppercase tracking-wider">
                                                            Saldo Rendah
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center border-none">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${etoll.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                                                    : 'bg-gray-50 text-gray-500 border-gray-200/60'
                                                    }`}>
                                                    {etoll.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right border-none">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <button
                                                        onClick={() => handleOpenTopUp(etoll)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                                        aria-label={`Top Up E-Toll ${etoll.card_name}`}
                                                    >
                                                        <Wallet className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(etoll)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                        aria-label={`Edit E-Toll ${etoll.card_name}`}
                                                    >
                                                        <Pencil className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(etoll.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                        aria-label={`Hapus E-Toll ${etoll.card_name}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        <div className="px-1"><h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Daftar E-Toll</h2></div>
                        {etolls.map(etoll => (
                            <div key={etoll.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 group hover:border-blue-100 transition-colors">
                                <div className="flex justify-between items-start mb-5">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-white ring-1 ring-slate-900/5 flex items-center justify-center shrink-0">
                                            <CreditCard className="h-4 w-4 text-slate-500" aria-hidden="true" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{etoll.card_name}</p>
                                            <p className="text-[11px] font-medium text-gray-400 mt-0.5">{etoll.card_number || 'Tanpa nomor seri'}</p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${etoll.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                                        : 'bg-gray-50 text-gray-500 border-gray-200/60'
                                        }`}>
                                        {etoll.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>

                                <div className={`p-4 rounded-xl mb-5 border ${etoll.balance >= 50000 ? 'bg-emerald-50/50 border-emerald-100/50' : 'bg-rose-50/50 border-rose-100/50'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${etoll.balance >= 50000 ? 'text-emerald-700/70' : 'text-rose-700/70'}`}>
                                            Saldo Berjalan
                                        </p>
                                        {etoll.balance < 50000 && (
                                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[8px] font-bold uppercase tracking-wider">
                                                Rendah
                                            </span>
                                        )}
                                    </div>
                                    <p className={`font-black text-xl tabular-nums tracking-tight ${etoll.balance >= 50000 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(etoll.balance)}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenTopUp(etoll)}
                                        className="py-2.5 px-4 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors flex justify-center items-center"
                                        aria-label={`Top Up kartu ${etoll.card_name}`}
                                    >
                                        <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(etoll)}
                                        className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors flex justify-center items-center gap-2"
                                        aria-label={`Edit kartu ${etoll.card_name}`}
                                    >
                                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(etoll.id)}
                                        className="py-2.5 px-4 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-colors flex items-center"
                                        aria-label={`Hapus kartu ${etoll.card_name}`}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Top Up Modal */}
            {showTopUpModal && topUpEtoll && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity"
                    style={{ overscrollBehavior: 'contain' }}
                >
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-white/20 transform transition flex flex-col max-h-[calc(100vh-2rem)] relative">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-50 to-white px-6 py-5 border-b border-gray-100 shrink-0">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Top Up Saldo E-Toll</h2>
                                    <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-wider">
                                        Isi Ulang Kartu
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowTopUpModal(false)}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors bg-white shadow-sm border border-gray-100"
                                    aria-label="Tutup form top up"
                                >
                                    <X className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleTopUp} className="p-6 space-y-5 overflow-y-auto">
                            {/* E-Toll Info Panel */}
                            <div className="bg-gray-50/80 rounded-xl p-4 flex gap-4 border border-gray-100">
                                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                                    <CreditCard className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">
                                        {topUpEtoll.card_name}
                                    </p>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5 mb-2 truncate">
                                        {topUpEtoll.card_number || 'Tanpa nomor seri'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Saldo Saat Ini:</span>
                                        <span className="text-sm font-bold text-gray-900 tabular-nums">
                                            {formatCurrency(topUpEtoll.balance)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 mt-2">
                                <label htmlFor="top_up_amount" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Jumlah Top Up (Rp) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="top_up_amount"
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    className="w-full px-4 py-4 bg-white border-2 border-emerald-100 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-2xl font-black tabular-nums text-emerald-700"
                                    placeholder="0"
                                    value={topUpAmount === 0 ? '' : topUpAmount}
                                    onChange={(e) => setTopUpAmount(Math.round(Number(e.target.value)) || 0)}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                />
                                {topUpAmount > 0 && (
                                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 mt-3 flex justify-between items-center">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">
                                            Total Saldo Baru
                                        </div>
                                        <div className="text-lg font-black text-emerald-600 tabular-nums tracking-tight">
                                            {formatCurrency(topUpEtoll.balance + topUpAmount)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 mt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowTopUpModal(false)}
                                    className="px-5 py-3 border border-gray-200 bg-white text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={topUpLoading || topUpAmount <= 0}
                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                                >
                                    {topUpLoading ? (
                                        <>
                                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                            Memproses…
                                        </>
                                    ) : (
                                        <>
                                            <Wallet className="h-4 w-4" aria-hidden="true" />
                                            Top Up Sekarang
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            {formMode && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity"
                    style={{ overscrollBehavior: 'contain' }}
                >
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-white/20 transform transition flex flex-col max-h-[calc(100vh-2rem)] relative">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100 shrink-0">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                                        {formMode === 'add' ? 'Tambah E-Toll Baru' : 'Koreksi Data E-Toll'}
                                    </h2>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                                        {formMode === 'add' ? 'Masukkan detail kartu baru' : 'Perbarui informasi kartu'}
                                    </p>
                                </div>
                                <button
                                    onClick={resetForm}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors bg-white shadow-sm border border-gray-100"
                                    aria-label="Tutup form"
                                >
                                    <X className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                            <div className="space-y-1.5">
                                <label htmlFor="card_name" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Nama Kartu / Pemegang <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="card_name"
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold"
                                    placeholder="Contoh: Mandiri E-Toll #1"
                                    value={formData.card_name}
                                    onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="card_number" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Nomor Kartu <span className="text-gray-400 normal-case tracking-normal text-xs">(Opsional)</span>
                                </label>
                                <input
                                    id="card_number"
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold tabular-nums tracking-wide"
                                    placeholder="Contoh: 1234 5678 9000"
                                    value={formData.card_number}
                                    onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="balance" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Saldo Berjalan (Rp)
                                </label>
                                <input
                                    id="balance"
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-lg font-bold tabular-nums"
                                    placeholder="0"
                                    value={formData.balance === 0 ? '' : formData.balance}
                                    onChange={(e) => setFormData({ ...formData, balance: Math.round(Number(e.target.value)) || 0 })}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                />
                                {formData.balance > 0 && (
                                    <div className="flex justify-between items-center px-1 pt-1 mt-1 text-[11px]">
                                        <span className="text-gray-500 font-bold uppercase tracking-wider">Preview</span>
                                        <span className="text-emerald-600 font-bold tabular-nums">
                                            {formatCurrency(formData.balance)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="status" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Status Penggunaan
                                </label>
                                <div id="status">
                                    <Select
                                        value={formData.status}
                                        onChange={(val) => setFormData({ ...formData, status: val as Etoll['status'] })}
                                        options={[
                                            { value: 'active', label: 'Aktif' },
                                            { value: 'inactive', label: 'Nonaktif' }
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-6 mt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-3 border border-gray-200 bg-white text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                                >
                                    {formLoading ? (
                                        <>
                                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                            Menyimpan…
                                        </>
                                    ) : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Form */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={executeDelete}
                title="Hapus E-Toll?"
                description="Menghapus kartu E-Toll akan menghilangkan referensi riwayat saldo terkait kartu ini."
                confirmText="Hapus Kartu"
                cancelText="Batal"
                loading={formLoading}
            />
        </div>
    );
}
