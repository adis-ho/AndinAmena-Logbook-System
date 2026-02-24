import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { User } from '../../types';
import { Wallet, Plus, RefreshCw, Users, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SkeletonManagementList } from '../../components/ui/Skeleton';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

export default function OperationalBudgetPage() {
    const { showToast } = useToast();
    const [drivers, setDrivers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<User | null>(null);
    const [topUpAmount, setTopUpAmount] = useState<number>(0);
    const [topUpLoading, setTopUpLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [editAmount, setEditAmount] = useState<number>(0);

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            const data = await ApiService.getDriversWithBalance();
            setDrivers(data);
        } catch (err) {
            setError('Gagal memuat data driver');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    // Real-time: auto-refresh when driver balances change
    useRealtimeSubscription({
        table: 'profiles',
        events: ['UPDATE'],
        onUpdate: fetchDrivers,
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const totalBalance = drivers.reduce((sum, d) => sum + d.operational_balance, 0);
    const totalNegativeBalance = drivers.filter(d => d.operational_balance < 0).reduce((sum, d) => sum + d.operational_balance, 0);

    const handleOpenTopUp = (driver: User) => {
        setSelectedDriver(driver);
        setTopUpAmount(0);
        setShowTopUpModal(true);
    };

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDriver || topUpAmount <= 0) {
            showToast('error', 'Jumlah harus lebih dari 0');
            return;
        }

        setTopUpLoading(true);
        try {
            await ApiService.topUpDriverBalance(selectedDriver.id, topUpAmount);
            showToast('success', `Berhasil top-up ${formatCurrency(topUpAmount)} untuk ${selectedDriver.full_name}`);
            setShowTopUpModal(false);
            setSelectedDriver(null);
            setTopUpAmount(0);
            fetchDrivers();
        } catch (err) {
            showToast('error', 'Gagal melakukan top-up');
            console.error(err);
        } finally {
            setTopUpLoading(false);
        }
    };

    const handleOpenEdit = (driver: User) => {
        setSelectedDriver(driver);
        setEditAmount(driver.operational_balance || 0);
        setShowEditModal(true);
    };

    const handleOpenReset = (driver: User) => {
        setSelectedDriver(driver);
        setShowResetModal(true);
    };

    const handleEditBalance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDriver) return;
        if (editAmount < 0) {
            showToast('error', 'Jumlah tidak boleh negatif');
            return;
        }

        setTopUpLoading(true);
        try {
            await ApiService.updateDriverBalance(selectedDriver.id, editAmount);
            showToast('success', `Berhasil mengubah saldo ${selectedDriver.full_name}`);
            setShowEditModal(false);
            setSelectedDriver(null);
            fetchDrivers();
        } catch (err) {
            showToast('error', 'Gagal mengubah saldo');
            console.error(err);
        } finally {
            setTopUpLoading(false);
        }
    };

    const handleResetBalance = async () => {
        if (!selectedDriver) return;
        setTopUpLoading(true);
        try {
            await ApiService.resetDriverBalance(selectedDriver.id);
            showToast('success', `Berhasil reset saldo ${selectedDriver.full_name}`);
            setShowResetModal(false);
            setSelectedDriver(null);
            fetchDrivers();
        } catch (err) {
            showToast('error', 'Gagal reset saldo');
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
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />
                <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100/50 flex items-center justify-center shadow-sm">
                        <Wallet className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Uang Operasional</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Kelola saldo e-toll dan parkir unit</p>
                    </div>
                </div>
                <button
                    onClick={fetchDrivers}
                    disabled={loading}
                    className="relative flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-300 shadow-sm disabled:opacity-50 group/btn"
                    aria-label="Refresh data saldo"
                >
                    <RefreshCw className={`h-4 w-4 transition-transform ${loading ? 'animate-spin text-blue-500' : 'group-hover/btn:rotate-180'}`} aria-hidden="true" />
                    <span>Perbarui Data</span>
                </button>
            </div>

            {/* Negative Balance Alert (Hutang Kantor) */}
            {totalNegativeBalance < 0 && (
                <div className="bg-gradient-to-r from-rose-50 to-white border border-rose-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-rose-400" />
                    <div className="flex items-center gap-4 relative">
                        <div className="p-3 bg-red-100/80 rounded-xl text-red-600 border border-red-200/50 shadow-sm group-hover:scale-105 transition-transform">
                            <TrendingDown className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-rose-900 uppercase tracking-wide">Total Saldo Minus (Hutang Kantor)</p>
                            <p className="text-xs font-semibold text-rose-600/80 mt-0.5">Total reimbursement yang harus dibayarkan ke driver</p>
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-rose-700 tabular-nums tracking-tight relative">
                        {formatCurrency(Math.abs(totalNegativeBalance))}
                    </p>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 border border-emerald-400 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500 blur-sm" />
                    <div className="flex items-center gap-3 mb-4 relative text-emerald-50">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
                            <Wallet className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider leading-tight text-emerald-100">Total Saldo<br />Tersedia</p>
                    </div>
                    <p className="text-3xl font-black text-white tabular-nums tracking-tight relative">{formatCurrency(totalBalance)}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
                    <div className="flex items-center gap-3 mb-4 relative">
                        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100/50 shadow-sm text-blue-600">
                            <Users className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-tight">Total<br />Driver Aktif</p>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tabular-nums relative">{drivers.length}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 relative overflow-hidden group hover:border-amber-200 transition-colors shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
                    <div className="flex items-center gap-3 mb-4 relative">
                        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100/50 shadow-sm text-amber-600">
                            <TrendingDown className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-tight">Driver<br />Saldo Kosong</p>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tabular-nums relative">
                        {drivers.filter(d => d.operational_balance === 0).length}
                    </p>
                </div>
            </div>

            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50/80 bg-gradient-to-r from-gray-50/50 to-white flex justify-between items-center">
                    <h2 className="text-sm font-bold text-gray-900">Daftar Rekapitulasi Driver</h2>
                    {/* Collapsible Info Tooltip replacement for 'Cara Kerja' card */}
                    <div className="group/tooltip relative">
                        <button className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full transition-colors" aria-label="Informasi cara kerja saldo">
                            Cara Kerja Saldo ?
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 text-white p-4 rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-10 translate-y-1 group-hover/tooltip:translate-y-0">
                            <ul className="text-xs space-y-2 text-slate-300">
                                <li><strong className="text-white">Isi Saldo:</strong> Admin top-up ke akun masing-masing driver.</li>
                                <li><strong className="text-white">Penggunaan:</strong> Driver lapor biaya tol/parkir di Logbook.</li>
                                <li><strong className="text-emerald-400">Pemotongan:</strong> Saldo dipotong otomatis HANYA saat laporan disetujui admin.</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none w-2/5">Identitas Driver</th>
                                <th className="text-right py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none">Sisa Saldo</th>
                                <th className="text-center py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none w-32">Status Akun</th>
                                <th className="text-right py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none w-48">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {drivers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 border-none">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 shadow-sm">
                                                <Users className="h-8 w-8 text-gray-300" aria-hidden="true" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">Belum ada driver terdaftar</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                drivers.map(driver => (
                                    <tr key={driver.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                        <td className="py-4 px-6 border-none">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-white flex items-center justify-center shadow-sm shrink-0 ring-1 ring-slate-900/5">
                                                    <span className="text-xs font-bold text-slate-600 uppercase">
                                                        {driver.full_name.substring(0, 2)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{driver.full_name}</p>
                                                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">@{driver.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right border-none">
                                            <span className={`text-[15px] font-black tabular-nums tracking-tight ${driver.operational_balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {formatCurrency(driver.operational_balance)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center border-none">
                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${driver.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                                                : 'bg-gray-50 text-gray-500 border-gray-200/60'
                                                }`}>
                                                {driver.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right border-none">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={() => handleOpenTopUp(driver)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                                    aria-label={`Top Up Saldo ${driver.full_name}`}
                                                >
                                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(driver)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                    aria-label={`Edit Saldo ${driver.full_name}`}
                                                >
                                                    <Pencil className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenReset(driver)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                    aria-label={`Reset Saldo ${driver.full_name}`}
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

            {/* Driver List - Mobile Cards */}
            <div className="md:hidden space-y-4">
                <div className="flex justify-between items-center mb-2 px-1">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Daftar Driver</h2>
                </div>
                {drivers.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <Users className="h-8 w-8 text-gray-300" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-bold text-gray-900">Belum ada driver</p>
                    </div>
                ) : (
                    drivers.map(driver => (
                        <div key={driver.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 group hover:border-blue-100 transition-colors">
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-white flex items-center justify-center shadow-sm shrink-0 ring-1 ring-slate-900/5">
                                        <span className="text-xs font-bold text-slate-600 uppercase">
                                            {driver.full_name.substring(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{driver.full_name}</p>
                                        <p className="text-[11px] font-medium text-gray-400 mt-0.5">@{driver.username}</p>
                                    </div>
                                </div>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${driver.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                                    : 'bg-gray-50 text-gray-500 border-gray-200/60'
                                    }`}>
                                    {driver.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>

                            <div className={`p-4 rounded-xl mb-5 border ${driver.operational_balance >= 0 ? 'bg-emerald-50/50 border-emerald-100/50' : 'bg-rose-50/50 border-rose-100/50'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${driver.operational_balance >= 0 ? 'text-emerald-700/70' : 'text-rose-700/70'}`}>
                                    Sisa Saldo Operasional
                                </p>
                                <p className={`font-black text-xl tabular-nums tracking-tight ${driver.operational_balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatCurrency(driver.operational_balance)}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenTopUp(driver)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-xs hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-95"
                                    aria-label={`Top Up Saldo ${driver.full_name}`}
                                >
                                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                    Isi
                                </button>
                                <button
                                    onClick={() => handleOpenEdit(driver)}
                                    className="px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors flex items-center justify-center"
                                    aria-label={`Edit Saldo ${driver.full_name}`}
                                >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                                <button
                                    onClick={() => handleOpenReset(driver)}
                                    className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-colors flex items-center justify-center"
                                    aria-label={`Reset Saldo ${driver.full_name}`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Top-Up Modal & Edit Modal (Merged Style) */}
            {(showTopUpModal || showEditModal) && selectedDriver && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    style={{ overscrollBehavior: 'contain' }}
                >
                    <div className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl border border-white/20 overflow-hidden transform transition flex flex-col max-h-[calc(100vh-2rem)]">
                        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6 relative shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowTopUpModal(false);
                                    setShowEditModal(false);
                                    setSelectedDriver(null);
                                    setTopUpAmount(0);
                                    setEditAmount(0);
                                }}
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors bg-white rounded-full p-1 border border-gray-100 shadow-sm"
                                aria-label="Tutup modal"
                            >
                                {/* We don't have an X imported so we use an inline SVG for closing, or we can just import it at top. For safety, using a text 'x' if an icon is missing or standard SVG */}
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">
                                {showTopUpModal ? 'Isi Saldo Operasional' : 'Koreksi Saldo'}
                            </h2>
                            <p className="text-xs font-bold text-gray-400 mt-1.5 uppercase tracking-wider">
                                Driver: {selectedDriver.full_name}
                            </p>
                        </div>

                        <form onSubmit={showTopUpModal ? handleTopUp : handleEditBalance} className="p-6 space-y-5 bg-white overflow-y-auto">
                            <div className="space-y-1.5">
                                <label htmlFor="amountInput" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    {showTopUpModal ? 'Nominal Top-Up (Rp)' : 'Saldo Akhir Berjalan (Rp)'}
                                </label>
                                <input
                                    id="amountInput"
                                    type="number"
                                    min={showTopUpModal ? "1" : "0"}
                                    step="1"
                                    autoFocus
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold tabular-nums text-lg"
                                    placeholder={showTopUpModal ? "Contoh: 150000" : "0"}
                                    value={(showTopUpModal ? topUpAmount : editAmount) || ''}
                                    onChange={(e) => {
                                        const val = Math.round(Number(e.target.value)) || 0;
                                        if (showTopUpModal) setTopUpAmount(val);
                                        else setEditAmount(val);
                                    }}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                />
                                <div className="pt-2 px-1 flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-medium">Saldo Awal: <span className="font-bold text-gray-700 tabular-nums">{formatCurrency(selectedDriver.operational_balance)}</span></span>
                                    {showTopUpModal && topUpAmount > 0 && (
                                        <span className="text-emerald-600 font-bold tabular-nums">Jadi: {formatCurrency(selectedDriver.operational_balance + topUpAmount)}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 mt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTopUpModal(false);
                                        setShowEditModal(false);
                                        setSelectedDriver(null);
                                        setTopUpAmount(0);
                                        setEditAmount(0);
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-200 bg-white text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={topUpLoading || (showTopUpModal ? topUpAmount <= 0 : editAmount < 0)}
                                    className={`flex-1 px-4 py-3 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${showTopUpModal
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25'
                                        }`}
                                >
                                    {topUpLoading ? (
                                        <>
                                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                            Memproses…
                                        </>
                                    ) : (
                                        showTopUpModal ? 'Top-Up Saldo' : 'Simpan Koreksi'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={showResetModal}
                onClose={() => {
                    setShowResetModal(false);
                    setSelectedDriver(null);
                }}
                onConfirm={handleResetBalance}
                title="Reset Saldo Operasional"
                description={`Anda yakin ingin mengosongkan saldo ${selectedDriver?.full_name} menjadi Rp 0?`}
                warningText="Saldo yang direset tidak bisa dikembalikan. Pastikan perhitungan tutup buku sudah sesuai."
                confirmText="Ya, Kosongkan Saldo"
                cancelText="Batal"
                loading={topUpLoading}
            />
        </div>
    );
}
