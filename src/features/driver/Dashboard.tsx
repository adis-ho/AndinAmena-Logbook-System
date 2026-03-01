import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import type { LogbookEntry } from '../../types';
import { BookOpen, PlusCircle, History, CheckCircle, Clock, XCircle, Wallet, ArrowRight, FileText, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SkeletonDriverDashboard } from '../../components/ui/Skeleton';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

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

    const fetchStats = useCallback(async () => {
        if (!user) return;
        try {
            const logbooks = await ApiService.getLogbooksByDriverId(user.id);
            let pendingLogbooks = 0;
            let approvedLogbooks = 0;
            let rejectedLogbooks = 0;
            let totalCost = 0;

            for (const logbook of logbooks) {
                if (logbook.status === 'submitted') pendingLogbooks += 1;
                if (logbook.status === 'approved') approvedLogbooks += 1;
                if (logbook.status === 'rejected') rejectedLogbooks += 1;
                totalCost += logbook.toll_cost + logbook.operational_cost;
            }

            setStats({
                totalLogbooks: logbooks.length,
                pendingLogbooks,
                approvedLogbooks,
                rejectedLogbooks,
                totalCost
            });

            setRecentLogbooks(logbooks.slice(0, 5));
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Real-time: auto-refresh when this driver's logbooks change
    useRealtimeSubscription({
        table: 'logbooks',
        events: ['INSERT', 'UPDATE', 'DELETE'],
        filter: user ? `driver_id=eq.${user.id}` : undefined,
        onUpdate: fetchStats,
        enabled: !!user,
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const getStatusBadge = (status: LogbookEntry['status']) => {
        const config = {
            draft: { bg: 'bg-gray-50', border: 'border-gray-200/60', text: 'text-gray-500', label: 'Draft', icon: Clock },
            submitted: { bg: 'bg-amber-50', border: 'border-amber-200/60', text: 'text-amber-600', label: 'Pending', icon: Clock },
            approved: { bg: 'bg-emerald-50', border: 'border-emerald-200/60', text: 'text-emerald-600', label: 'Disetujui', icon: CheckCircle },
            rejected: { bg: 'bg-rose-50', border: 'border-rose-200/60', text: 'text-rose-600', label: 'Ditolak', icon: XCircle }
        };
        const statusConfig = config[status] || config.submitted;
        const { bg, border, text, label, icon: Icon } = statusConfig;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-bold border ${bg} ${border} ${text}`}>
                <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
                {label}
            </span>
        );
    };

    if (loading) {
        return <SkeletonDriverDashboard />;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header Area */}
            <div className="pt-2 sm:pt-4">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Selamat Datang, {user?.full_name}! 👋</h1>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Link
                    to="/driver/logbook"
                    className="group relative flex items-center gap-5 p-6 md:p-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[2rem] hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner flex items-center justify-center shrink-0 border border-white/20">
                        <PlusCircle className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <div>
                        <p className="font-black text-xl tracking-wide mb-1">Input Laporan Harian</p>
                        <p className="text-blue-100 text-sm font-medium">Catat rute & biaya hari ini</p>
                    </div>
                </Link>
                <Link
                    to="/driver/history"
                    className="group flex items-center justify-between p-6 md:p-8 bg-white border border-gray-200 shadow-sm rounded-[2rem] hover:border-blue-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 active:scale-[0.98]"
                >
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors duration-300">
                            <History className="h-7 w-7 text-gray-400 group-hover:text-blue-600 transition-colors duration-300" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="font-black text-gray-900 text-xl tracking-wide mb-1 group-hover:text-blue-700 transition-colors duration-300">Lihat Riwayat</p>
                            <p className="text-gray-500 text-sm font-medium">Cek status semua laporan</p>
                        </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300 hidden sm:block" aria-hidden="true" />
                </Link>
            </div>

            {/* Hero Card - Unified Dashboard */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[2rem] overflow-hidden shadow-xl shadow-emerald-500/10 border border-emerald-400/50">
                {/* Saldo Section */}
                <div className="p-8 md:p-10 text-white relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-emerald-100 tracking-widest mb-2 opacity-90">Saldo Uang Operasional</p>
                            <p className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter drop-shadow-sm">{formatCurrency(user?.operational_balance || 0)}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-inner hidden xs:block transform rotate-3">
                            <Wallet className="h-10 w-10 text-emerald-50" aria-hidden="true" />
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="bg-white/95 backdrop-blur-xl p-6 md:p-8 m-1.5 rounded-[1.5rem] border border-white/40 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60">RINGKASAN TUGAS BARU-BARU INI</p>
                        <div className="h-px bg-gray-100 flex-1 ml-4 hidden sm:block"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center shrink-0">
                                <BookOpen className="h-5 w-5 text-blue-600" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
                                <p className="text-2xl font-black text-gray-900 tabular-nums tracking-tight leading-none">{stats.totalLogbooks}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center shrink-0">
                                <Clock className="h-5 w-5 text-amber-500" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Pending</p>
                                <p className="text-2xl font-black text-amber-600 tabular-nums tracking-tight leading-none">{stats.pendingLogbooks}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center shrink-0">
                                <CheckCircle className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Disetujui</p>
                                <p className="text-2xl font-black text-emerald-600 tabular-nums tracking-tight leading-none">{stats.approvedLogbooks}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100/50 flex items-center justify-center shrink-0">
                                <XCircle className="h-5 w-5 text-rose-500" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Ditolak</p>
                                <p className="text-2xl font-black text-rose-600 tabular-nums tracking-tight leading-none">{stats.rejectedLogbooks}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Biaya */}
                    <div className="mt-8 pt-6 border-t border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" aria-hidden="true" /> Total Akumulasi Biaya Rute</span>
                        <span className="text-2xl font-black text-gray-900 tabular-nums tracking-tight">{formatCurrency(stats.totalCost)}</span>
                    </div>
                </div>
            </div>

            {/* Recent Logbooks */}
            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Laporan Terbaru</h2>
                    {recentLogbooks.length > 0 && (
                        <Link to="/driver/history" className="text-[11px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-800 transition-colors">
                            Lihat Semua
                        </Link>
                    )}
                </div>

                {recentLogbooks.length > 0 ? (
                    <div className="space-y-4">
                        {recentLogbooks.map(log => (
                            <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/50 rounded-[1.5rem] border border-gray-100/60 hover:bg-slate-50/80 hover:border-blue-100/50 transition-colors duration-200 gap-4">
                                <div>
                                    <p className="font-bold text-gray-900 tracking-tight line-clamp-1 mb-1 text-sm md:text-base">{log.client_name} - {log.rute}</p>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider tabular-nums">{new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-1">
                                    {getStatusBadge(log.status)}
                                    <p className="text-sm md:text-base font-black text-gray-900 tabular-nums tracking-tight">{formatCurrency(log.toll_cost + log.operational_cost)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-gray-50/50 rounded-[1.5rem] border border-dashed border-gray-200">
                        <div className="w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm mb-4">
                            <FileText className="h-8 w-8 text-gray-300" aria-hidden="true" />
                        </div>
                        <h3 className="font-black text-gray-900 text-lg mb-1 tracking-tight">Belum ada laporan</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-sm">Anda belum mencatat perjalanan apapun. Mulai catat perjalanan pertama Anda hari ini.</p>
                        <Link
                            to="/driver/logbook"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200 font-bold active:scale-95 shadow-md shadow-blue-500/20"
                        >
                            <PlusCircle className="h-4 w-4" aria-hidden="true" />
                            Input Laporan Baru
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
