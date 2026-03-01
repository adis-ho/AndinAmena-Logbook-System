import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import type { BalanceLog, EtollLog } from '../../types';
import { FileText, Wallet, TrendingUp, TrendingDown, RotateCcw, Edit, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { SkeletonManagementList } from '../../components/ui/Skeleton';
import { queryKeys } from '../../lib/queryKeys';
import { useEtollsQuery, useUsersQuery } from '../../hooks/useReferenceDataQueries';

export default function TransactionLogsPage() {
    const [activeTab, setActiveTab] = useState<'operational' | 'etoll'>('operational');
    const { data: users = [] } = useUsersQuery();
    const { data: etolls = [] } = useEtollsQuery();
    const { data: balanceLogs = [], isPending: isBalanceLogsPending } = useQuery<BalanceLog[]>({
        queryKey: queryKeys.balanceLogs,
        queryFn: ApiService.getBalanceLogs
    });
    const { data: etollLogs = [], isPending: isEtollLogsPending } = useQuery<EtollLog[]>({
        queryKey: queryKeys.etollLogs,
        queryFn: ApiService.getEtollLogs
    });
    const loading = isBalanceLogsPending || isEtollLogsPending;

    const userMap = useMemo(() => new Map(users.map(user => [user.id, user.full_name])), [users]);
    const etollMap = useMemo(() => new Map(etolls.map(etoll => [etoll.id, etoll.card_name])), [etolls]);

    const getUserName = (userId?: string) => {
        if (!userId) return 'System';
        return userMap.get(userId) || 'Unknown User';
    };

    const getEtollName = (etollId: string) => {
        return etollMap.get(etollId) || 'Unknown E-Toll';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const getActionBadge = (type: string) => {
        const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest border shadow-sm";
        switch (type) {
            case 'top_up':
                return <span className={`${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200/60`}><TrendingUp className="h-3 w-3" aria-hidden="true" /> Top Up</span>;
            case 'deduct':
                return <span className={`${baseClasses} bg-rose-50 text-rose-700 border-rose-200/60`}><TrendingDown className="h-3 w-3" aria-hidden="true" /> Mutasi</span>;
            case 'edit':
                return <span className={`${baseClasses} bg-indigo-50 text-indigo-700 border-indigo-200/60`}><Edit className="h-3 w-3" aria-hidden="true" /> Koreksi</span>;
            case 'reset':
                return <span className={`${baseClasses} bg-amber-50 text-amber-700 border-amber-200/60`}><RotateCcw className="h-3 w-3" aria-hidden="true" /> Reset</span>;
            default:
                return <span className={`${baseClasses} bg-gray-50 text-gray-600 border-gray-200/60`}>{type}</span>;
        }
    };

    if (loading) return <SkeletonManagementList />;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-bl-full -mr-20 -mt-20 pointer-events-none" />
                <div className="flex items-center gap-5 relative">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center shadow-inner relative overflow-hidden group-hover:shadow-md transition-shadow duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <FileText className="h-7 w-7 text-indigo-600 relative z-10" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Riwayat Transaksi</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Audit trail lengkap mutasi dana dan pemakaian kartu E-Toll</p>
                    </div>
                </div>
            </div>

            {/* Segmented Control Tabs */}
            <div className="flex justify-center md:justify-start">
                <div
                    className="inline-flex p-1.5 bg-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm"
                    role="tablist"
                    aria-label="Kategori Transaksi"
                >
                    <button
                        role="tab"
                        aria-selected={activeTab === 'operational'}
                        aria-controls="operational-panel"
                        onClick={() => setActiveTab('operational')}
                        className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'operational'
                            ? 'bg-white text-indigo-600 shadow-sm border border-gray-100/50 scale-100'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 scale-95 hover:scale-100'
                            }`}
                    >
                        <Wallet className="h-4 w-4" aria-hidden="true" />
                        Kas Operasional
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'etoll'}
                        aria-controls="etoll-panel"
                        onClick={() => setActiveTab('etoll')}
                        className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'etoll'
                            ? 'bg-white text-indigo-600 shadow-sm border border-gray-100/50 scale-100'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 scale-95 hover:scale-100'
                            }`}
                    >
                        <CreditCard className="h-4 w-4" aria-hidden="true" />
                        Mutasi E-Toll
                    </button>
                </div>
            </div>

            {/* Operational Logs Panel */}
            {activeTab === 'operational' && (
                <div id="operational-panel" role="tabpanel" className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-8 py-6 border-b border-gray-50/80 bg-gradient-to-r from-gray-50/30 to-white flex justify-between items-center">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Buku Kas Operasional</h2>
                        <div className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{balanceLogs.length} Entri</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50/30 border-b border-gray-100">
                                    <th className="text-left py-5 px-8 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none w-48">Waktu Transaksi</th>
                                    <th className="text-left py-5 px-4 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Subjek (Driver)</th>
                                    <th className="text-left py-5 px-4 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Jenis Mutasi</th>
                                    <th className="text-right py-5 px-4 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Nominal</th>
                                    <th className="text-right py-5 px-4 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Saldo Awal & Akhir</th>
                                    <th className="text-left py-5 px-4 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Otorisator</th>
                                    <th className="text-left py-5 px-8 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none w-64">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {balanceLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-24">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
                                                    <Wallet className="h-8 w-8 text-gray-300" aria-hidden="true" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 mb-1">Buku Kas Kosong</p>
                                                <p className="text-xs text-gray-500 max-w-sm">Belum ada aktivitas mutasi dana operasional yang tercatat di dalam sistem.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    balanceLogs.map(log => (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                            <td className="py-5 px-8 border-none">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">{format(new Date(log.created_at), 'dd MMM yyyy', { locale: id })}</span>
                                                    <span className="text-[11px] font-bold text-gray-400 tabular-nums uppercase tracking-widest mt-0.5">{format(new Date(log.created_at), 'HH:mm:ss', { locale: id })}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 border-none">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{getUserName(log.driver_id)}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Driver</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 border-none">
                                                {getActionBadge(log.action_type)}
                                            </td>
                                            <td className="py-5 px-4 text-right border-none">
                                                <span className={`text-[15px] tabular-nums tracking-tight font-black ${log.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {log.amount > 0 ? '+' : ''}{formatCurrency(log.amount)}
                                                </span>
                                            </td>
                                            <td className="py-5 px-4 text-right border-none">
                                                <div className="flex flex-col items-end justify-center">
                                                    <div className="flex items-center gap-2 group/saldo">
                                                        <span className="text-xs text-gray-400 font-medium tabular-nums line-through decoration-gray-300">{formatCurrency(log.previous_balance)}</span>
                                                        <span className="text-gray-300">→</span>
                                                        <span className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(log.new_balance)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 border-none">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-[10px] font-black text-gray-500">
                                                        {getUserName(log.admin_id).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-600">{getUserName(log.admin_id)}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8 border-none">
                                                <p className="text-xs font-medium text-gray-600 max-w-[240px] leading-relaxed line-clamp-2" title={log.description}>
                                                    {log.description}
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* E-Toll Logs Panel */}
            {activeTab === 'etoll' && (
                <div id="etoll-panel" role="tabpanel" className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-8 py-6 border-b border-gray-50/80 bg-gradient-to-r from-gray-50/30 to-white flex justify-between items-center">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Daftar Mutasi E-Toll</h2>
                        <div className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{etollLogs.length} Entri</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50/30 border-b border-gray-100">
                                    <th className="text-left py-5 px-8 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none w-48">Waktu Transaksi</th>
                                    <th className="text-left py-5 px-4 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Identitas Kartu</th>
                                    <th className="text-left py-5 px-4 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Jenis Mutasi</th>
                                    <th className="text-right py-5 px-4 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Nominal</th>
                                    <th className="text-right py-5 px-4 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Saldo Awal & Akhir</th>
                                    <th className="text-left py-5 px-4 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Otorisator</th>
                                    <th className="text-left py-5 px-8 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none w-64">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {etollLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-24">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
                                                    <CreditCard className="h-8 w-8 text-gray-300" aria-hidden="true" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 mb-1">Riwayat E-Toll Kosong</p>
                                                <p className="text-xs text-gray-500 max-w-sm">Belum ada aktivitas mutasi atau penggunaan saldo E-Toll yang tercatat.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    etollLogs.map(log => (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                            <td className="py-5 px-8 border-none">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">{format(new Date(log.created_at), 'dd MMM yyyy', { locale: id })}</span>
                                                    <span className="text-[11px] font-bold text-gray-400 tabular-nums uppercase tracking-widest mt-0.5">{format(new Date(log.created_at), 'HH:mm:ss', { locale: id })}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 border-none">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{getEtollName(log.etoll_id)}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">E-Toll</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 border-none">
                                                {getActionBadge(log.action_type)}
                                            </td>
                                            <td className="py-5 px-4 text-right border-none">
                                                <span className={`text-[15px] tabular-nums tracking-tight font-black ${log.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {log.amount > 0 ? '+' : ''}{formatCurrency(log.amount)}
                                                </span>
                                            </td>
                                            <td className="py-5 px-4 text-right border-none">
                                                <div className="flex flex-col items-end justify-center">
                                                    <div className="flex items-center gap-2 group/saldo">
                                                        <span className="text-xs text-gray-400 font-medium tabular-nums line-through decoration-gray-300">{formatCurrency(log.previous_balance)}</span>
                                                        <span className="text-gray-300">→</span>
                                                        <span className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(log.new_balance)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 border-none">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-[10px] font-black text-gray-500">
                                                        {getUserName(log.admin_id).charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-600">{getUserName(log.admin_id)}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8 border-none">
                                                <p className="text-xs font-medium text-gray-600 max-w-[240px] leading-relaxed line-clamp-2" title={log.description}>
                                                    {log.description}
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
