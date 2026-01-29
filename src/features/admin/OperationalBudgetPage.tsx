import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { User } from '../../types';
import { Wallet, Plus, RefreshCw, Users, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SkeletonManagementList } from '../../components/ui/Skeleton';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';

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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const totalBalance = drivers.reduce((sum, d) => sum + d.operational_balance, 0);

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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Wallet className="h-6 w-6 text-green-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Uang Operasional</h1>
                </div>
                <button
                    onClick={fetchDrivers}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Wallet className="h-5 w-5" />
                        <p className="text-green-100 text-sm font-medium">Total Saldo</p>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <p className="text-gray-500 text-sm font-medium">Total Driver</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingDown className="h-5 w-5 text-orange-500" />
                        <p className="text-gray-500 text-sm font-medium">Saldo Kosong</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{drivers.filter(d => d.operational_balance === 0).length}</p>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">Cara Kerja:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Admin top-up saldo ke akun driver masing-masing</li>
                    <li>• Driver mengisi biaya operasional saat submit laporan</li>
                    <li>• Saldo <strong>baru terpotong</strong> saat admin menyetujui laporan</li>
                    <li>• Jika laporan ditolak, saldo tetap utuh</li>
                </ul>
            </div>

            {/* Driver List - Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Daftar Driver</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {drivers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada driver
                                    </td>
                                </tr>
                            ) : (
                                drivers.map(driver => (
                                    <tr key={driver.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{driver.full_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {driver.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`font-semibold ${driver.operational_balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                {formatCurrency(driver.operational_balance)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${driver.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {driver.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleOpenTopUp(driver)}
                                                    className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                                    title="Top Up"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(driver)}
                                                    className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                                                    title="Edit Saldo"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenReset(driver)}
                                                    className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                                                    title="Reset Saldo"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
                <h2 className="text-lg font-semibold text-gray-900">Daftar Driver</h2>
                {drivers.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Belum ada driver</p>
                    </div>
                ) : (
                    drivers.map(driver => (
                        <div key={driver.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-semibold text-gray-900">{driver.full_name}</p>
                                    <p className="text-sm text-gray-500">@{driver.username}</p>
                                </div>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${driver.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {driver.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>

                            <div className="bg-green-50 p-3 rounded-lg mb-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-green-700 text-sm">Saldo Operasional</span>
                                    <span className={`font-bold text-lg ${driver.operational_balance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {formatCurrency(driver.operational_balance)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenTopUp(driver)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Top-Up
                                </button>
                                <button
                                    onClick={() => handleOpenEdit(driver)}
                                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleOpenReset(driver)}
                                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Top-Up Modal */}
            {showTopUpModal && selectedDriver && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Top-Up Saldo</h2>
                        <p className="text-gray-600 mb-4">
                            Driver: <strong>{selectedDriver.full_name}</strong>
                        </p>

                        <form onSubmit={handleTopUp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Jumlah Top-Up (Rp)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    required
                                    autoFocus
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                    placeholder="100000"
                                    value={topUpAmount || ''}
                                    onChange={(e) => setTopUpAmount(Math.round(Number(e.target.value)) || 0)}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Saldo saat ini: {formatCurrency(selectedDriver.operational_balance)}
                                </p>
                                <p className="text-sm text-green-600 font-medium">
                                    Saldo baru: {formatCurrency(selectedDriver.operational_balance + topUpAmount)}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTopUpModal(false);
                                        setSelectedDriver(null);
                                        setTopUpAmount(0);
                                    }}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={topUpLoading || topUpAmount <= 0}
                                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {topUpLoading ? 'Memproses...' : 'Top-Up'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Balance Modal */}
            {showEditModal && selectedDriver && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Edit Saldo Operasional</h2>
                        <p className="text-gray-600 mb-4">
                            Driver: <strong>{selectedDriver.full_name}</strong>
                        </p>

                        <form onSubmit={handleEditBalance} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Saldo Baru (Rp)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    autoFocus
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                    value={editAmount === 0 ? '' : editAmount}
                                    onChange={(e) => setEditAmount(Number(e.target.value))}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Saldo saat ini: {formatCurrency(selectedDriver.operational_balance)}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedDriver(null);
                                    }}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={topUpLoading || editAmount < 0}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {topUpLoading ? 'Menyimpan...' : 'Simpan'}
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
                title="Reset Saldo Operasional?"
                description={`Apakah Anda yakin ingin mereset saldo ${selectedDriver?.full_name} menjadi Rp 0?`}
                warningText="Tindakan ini akan dicatat dalam log riwayat."
                confirmText="Reset Saldo"
                cancelText="Batal"
                loading={topUpLoading}
            />
        </div>
    );
}
