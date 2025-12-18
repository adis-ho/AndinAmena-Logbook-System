import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { User } from '../../types';
import { Wallet, Plus, RefreshCw, Users, TrendingDown } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SkeletonManagementList } from '../../components/ui/Skeleton';

export default function OperationalBudgetPage() {
    const { showToast } = useToast();
    const [drivers, setDrivers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<User | null>(null);
    const [topUpAmount, setTopUpAmount] = useState<number>(0);
    const [topUpLoading, setTopUpLoading] = useState(false);

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
                    <Wallet className="h-6 w-6 text-green-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Uang Operasional</h1>
                </div>
                <button
                    onClick={fetchDrivers}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
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

            {/* Driver List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Daftar Driver</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
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
                                            <button
                                                onClick={() => handleOpenTopUp(driver)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Top-Up
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
        </div>
    );
}
