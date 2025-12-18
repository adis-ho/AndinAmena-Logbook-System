import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import type { LogbookEntry } from '../../types';
import { BookOpen, PlusCircle, History, CheckCircle, Clock, XCircle, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SkeletonDriverDashboard } from '../../components/ui/Skeleton';

interface DashboardStats {
    totalLogbooks: number;
    pendingLogbooks: number;
    approvedLogbooks: number;
    rejectedLogbooks: number;
    totalCost: number;
}

export default function DriverDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalLogbooks: 0,
        pendingLogbooks: 0,
        approvedLogbooks: 0,
        rejectedLogbooks: 0,
        totalCost: 0
    });
    const [recentLogbooks, setRecentLogbooks] = useState<LogbookEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchStats = async () => {
            try {
                const logbooks = await ApiService.getLogbooksByDriverId(user.id);

                setStats({
                    totalLogbooks: logbooks.length,
                    pendingLogbooks: logbooks.filter(l => l.status === 'submitted').length,
                    approvedLogbooks: logbooks.filter(l => l.status === 'approved').length,
                    rejectedLogbooks: logbooks.filter(l => l.status === 'rejected').length,
                    totalCost: logbooks.reduce((sum, l) => sum + l.toll_cost + l.operational_cost, 0)
                });

                setRecentLogbooks(logbooks.slice(0, 5));
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const getStatusBadge = (status: LogbookEntry['status']) => {
        const config = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft', icon: Clock },
            submitted: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', icon: Clock },
            approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Disetujui', icon: CheckCircle },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Ditolak', icon: XCircle }
        };
        const statusConfig = config[status] || config.submitted;
        const { bg, text, label, icon: Icon } = statusConfig;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
                <Icon className="h-3 w-3" />
                {label}
            </span>
        );
    };

    if (loading) {
        return <SkeletonDriverDashboard />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Selamat Datang, {user?.full_name}!</h1>
                <p className="text-gray-500 mt-1">Berikut ringkasan laporan Anda.</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    to="/driver/logbook"
                    className="flex items-center gap-4 p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                    <PlusCircle className="h-8 w-8" />
                    <div>
                        <p className="font-bold text-lg">Input Laporan Harian</p>
                        <p className="text-blue-100 text-sm">Catat perjalanan hari ini</p>
                    </div>
                </Link>
                <Link
                    to="/driver/history"
                    className="flex items-center gap-4 p-6 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors"
                >
                    <History className="h-8 w-8 text-gray-600" />
                    <div>
                        <p className="font-bold text-lg">Lihat Riwayat</p>
                        <p className="text-gray-500 text-sm">Semua laporan Anda</p>
                    </div>
                </Link>
            </div>

            {/* Hero Card - Unified Dashboard */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl overflow-hidden shadow-lg">
                {/* Saldo Section */}
                <div className="p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Wallet className="h-5 w-5" />
                                <p className="text-green-100 text-sm font-medium">Saldo Uang Operasional</p>
                            </div>
                            <p className="text-3xl font-bold">{formatCurrency(user?.operational_balance || 0)}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl">
                            <Wallet className="h-8 w-8" />
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="bg-white/95 backdrop-blur p-4">
                    <p className="text-xs text-gray-500 font-medium mb-3">RINGKASAN LAPORAN</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-lg">
                                <BookOpen className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-lg font-bold text-gray-900">{stats.totalLogbooks}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-yellow-100 p-1.5 rounded-lg">
                                <Clock className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Pending</p>
                                <p className="text-lg font-bold text-yellow-600">{stats.pendingLogbooks}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1.5 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Disetujui</p>
                                <p className="text-lg font-bold text-green-600">{stats.approvedLogbooks}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-red-100 p-1.5 rounded-lg">
                                <XCircle className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Ditolak</p>
                                <p className="text-lg font-bold text-red-600">{stats.rejectedLogbooks}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Biaya */}
                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Biaya Dikeluarkan</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(stats.totalCost)}</span>
                    </div>
                </div>
            </div>

            {/* Recent Logbooks */}
            {recentLogbooks.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-900 mb-4">Laporan Terbaru</h2>
                    <div className="space-y-3">
                        {recentLogbooks.map(log => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{log.client_name} - {log.rute}</p>
                                    <p className="text-sm text-gray-500">{new Date(log.date).toLocaleDateString('id-ID')}</p>
                                </div>
                                <div className="text-right">
                                    {getStatusBadge(log.status)}
                                    <p className="text-sm text-gray-500 mt-1">{formatCurrency(log.toll_cost + log.operational_cost)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
