import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import type { LogbookEntry } from '../../types';
import { BookOpen, PlusCircle, History, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
    totalLogbooks: number;
    pendingLogbooks: number;
    approvedLogbooks: number;
    rejectedLogbooks: number;
    totalKm: number;
    totalCost: number;
}

export default function DriverDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalLogbooks: 0,
        pendingLogbooks: 0,
        approvedLogbooks: 0,
        rejectedLogbooks: 0,
        totalKm: 0,
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
                    totalKm: logbooks.reduce((sum, l) => sum + l.total_km, 0),
                    totalCost: logbooks.reduce((sum, l) => sum + l.total_cost, 0)
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
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Selamat Datang, {user?.full_name}!</h1>
                <p className="text-gray-500 mt-1">Berikut ringkasan logbook Anda.</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    to="/driver/logbook"
                    className="flex items-center gap-4 p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                    <PlusCircle className="h-8 w-8" />
                    <div>
                        <p className="font-bold text-lg">Input Logbook Baru</p>
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
                        <p className="text-gray-500 text-sm">Semua logbook Anda</p>
                    </div>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalLogbooks}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-lg">
                            <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-xl font-bold text-yellow-600">{stats.pendingLogbooks}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Disetujui</p>
                            <p className="text-xl font-bold text-green-600">{stats.approvedLogbooks}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                            <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ditolak</p>
                            <p className="text-xl font-bold text-red-600">{stats.rejectedLogbooks}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
                    <p className="text-blue-100 text-sm">Total Jarak Tempuh</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalKm.toLocaleString()} km</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
                    <p className="text-green-100 text-sm">Total Biaya</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalCost)}</p>
                </div>
            </div>

            {/* Recent Logbooks */}
            {recentLogbooks.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-900 mb-4">Logbook Terbaru</h2>
                    <div className="space-y-3">
                        {recentLogbooks.map(log => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{log.activities.substring(0, 50)}...</p>
                                    <p className="text-sm text-gray-500">{new Date(log.date).toLocaleDateString('id-ID')}</p>
                                </div>
                                <div className="text-right">
                                    {getStatusBadge(log.status)}
                                    <p className="text-sm text-gray-500 mt-1">{formatCurrency(log.total_cost)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
