import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import type { BalanceLog, EtollLog } from '../../types';
import { Wallet, TrendingUp, TrendingDown, RotateCcw, Edit, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { SkeletonTransactionLogs } from '../../components/ui/Skeleton';
import { queryKeys } from '../../lib/queryKeys';
import { useEtollsQuery, useUsersQuery } from '../../hooks/useReferenceDataQueries';

interface NormalizedLog {
    id: string;
    created_at: string;
    subjectName: string;
    subjectType: 'Driver' | 'E-Toll';
    action_type: string;
    amount: number;
    previous_balance: number;
    new_balance: number;
    adminName: string;
    description: string;
}

export default function TransactionLogsPage() {
    const [activeTab, setActiveTab] = useState<'operational' | 'etoll'>('operational');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

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
        if (!userId) return 'Sistem';
        return userMap.get(userId) || 'Pengguna Tidak Dikenal';
    };

    const getEtollName = (etollId: string) => {
        return etollMap.get(etollId) || 'Kartu E-Toll';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const getActionBadge = (type: string) => {
        const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border select-none";
        switch (type) {
            case 'top_up':
                return (
                    <span className={`${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-200/80`}>
                        <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        <span>Top Up</span>
                    </span>
                );
            case 'deduct':
                return (
                    <span className={`${baseClasses} bg-rose-50 text-rose-700 border-rose-200/80`}>
                        <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        <span>Pengeluaran</span>
                    </span>
                );
            case 'edit':
                return (
                    <span className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-200/80`}>
                        <Edit className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        <span>Koreksi</span>
                    </span>
                );
            case 'reset':
                return (
                    <span className={`${baseClasses} bg-amber-50 text-amber-700 border-amber-200/80`}>
                        <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        <span>Reset</span>
                    </span>
                );
            case 'refund':
                return (
                    <span className={`${baseClasses} bg-teal-50 text-teal-700 border-teal-200/80`}>
                        <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        <span>Refund</span>
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} bg-slate-50 text-slate-700 border-slate-200/80`}>
                        <span>{type}</span>
                    </span>
                );
        }
    };

    const handleTabChange = (newTab: 'operational' | 'etoll') => {
        setActiveTab(newTab);
        setCurrentPage(1);
    };

    const handleTabKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            handleTabChange(activeTab === 'operational' ? 'etoll' : 'operational');
        }
    };

    const logs: NormalizedLog[] = useMemo(() => {
        if (activeTab === 'operational') {
            return balanceLogs.map(log => ({
                id: log.id,
                created_at: log.created_at,
                subjectName: getUserName(log.driver_id),
                subjectType: 'Driver' as const,
                action_type: log.action_type,
                amount: log.amount,
                previous_balance: log.previous_balance,
                new_balance: log.new_balance,
                adminName: getUserName(log.admin_id),
                description: log.description
            }));
        } else {
            return etollLogs.map(log => ({
                id: log.id,
                created_at: log.created_at,
                subjectName: getEtollName(log.etoll_id),
                subjectType: 'E-Toll' as const,
                action_type: log.action_type,
                amount: log.amount,
                previous_balance: log.previous_balance,
                new_balance: log.new_balance,
                adminName: getUserName(log.admin_id),
                description: log.description
            }));
        }
    }, [activeTab, balanceLogs, etollLogs, users, etolls]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, logs.length);
    const paginatedLogs = useMemo(() => logs.slice(startIndex, endIndex), [logs, startIndex, endIndex]);

    // Visible page numbers for desktop pagination
    const visiblePages = useMemo(() => {
        const delta = 1;
        const range: (number | 'ellipsis')[] = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                range.push(i);
            } else if (range[range.length - 1] !== 'ellipsis') {
                range.push('ellipsis');
            }
        }
        return range;
    }, [totalPages, currentPage]);

    if (loading) return <SkeletonTransactionLogs />;

    return (
        <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-4">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Riwayat Transaksi</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                        Audit trail lengkap mutasi dana operasional dan pemakaian kartu E-Toll
                    </p>
                </div>
            </div>

            {/* Segmented Control Tabs & Page Size Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div
                    className="w-full sm:w-auto relative flex sm:inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 touch-manipulation select-none"
                    role="tablist"
                    aria-label="Kategori Transaksi"
                    onKeyDown={handleTabKeyDown}
                >
                    {/* Hardware-accelerated sliding pill indicator */}
                    <div
                        className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-transform duration-200 ease-out pointer-events-none"
                        style={{
                            transform: activeTab === 'operational' ? 'translateX(0%)' : 'translateX(100%)',
                        }}
                        aria-hidden="true"
                    />

                    <button
                        role="tab"
                        id="tab-operational"
                        aria-selected={activeTab === 'operational'}
                        aria-controls="panel-logs"
                        tabIndex={activeTab === 'operational' ? 0 : -1}
                        onClick={() => handleTabChange('operational')}
                        className={`relative z-10 flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-sm transition-colors duration-150 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            activeTab === 'operational'
                                ? 'text-blue-600 font-bold'
                                : 'text-slate-600 hover:text-slate-900 font-semibold'
                        }`}
                    >
                        <Wallet className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                        <span>Kas Operasional</span>
                    </button>
                    <button
                        role="tab"
                        id="tab-etoll"
                        aria-selected={activeTab === 'etoll'}
                        aria-controls="panel-logs"
                        tabIndex={activeTab === 'etoll' ? 0 : -1}
                        onClick={() => handleTabChange('etoll')}
                        className={`relative z-10 flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-sm transition-colors duration-150 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            activeTab === 'etoll'
                                ? 'text-blue-600 font-bold'
                                : 'text-slate-600 hover:text-slate-900 font-semibold'
                        }`}
                    >
                        <CreditCard className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                        <span>Mutasi E-Toll</span>
                    </button>
                </div>

                {/* Rows per page selector with native mobile touch sizing */}
                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500 font-medium px-1 sm:px-0">
                    <span>Tampilkan per halaman:</span>
                    <div className="inline-flex bg-white rounded-lg border border-slate-200 shadow-sm p-0.5 touch-manipulation select-none">
                        {[10, 25, 50].map((size) => (
                            <button
                                key={size}
                                onClick={() => {
                                    setPageSize(size);
                                    setCurrentPage(1);
                                }}
                                className={`min-h-[36px] px-3 text-xs font-semibold rounded-md transition-all duration-150 active:scale-95 ${
                                    pageSize === size
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logs Panel */}
            <div
                id="panel-logs"
                role="tabpanel"
                aria-labelledby={activeTab === 'operational' ? 'tab-operational' : 'tab-etoll'}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
                <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 sm:gap-2">
                    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {activeTab === 'operational' ? 'Buku Kas Operasional' : 'Daftar Mutasi E-Toll'}
                    </h2>
                    <span className="text-xs font-semibold text-slate-600 tabular-nums">
                        {logs.length === 0
                            ? '0 Entri'
                            : `Menampilkan ${startIndex + 1}–${endIndex} dari ${logs.length} entri`}
                    </span>
                </div>

                {/* Desktop Table (Hidden on Mobile) */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full min-w-[960px]">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-100">
                                <th scope="col" className="text-left py-3.5 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500 w-44">Waktu Transaksi</th>
                                <th scope="col" className="text-left py-3.5 px-4 text-xs uppercase tracking-wider font-semibold text-slate-500">
                                    {activeTab === 'operational' ? 'Driver' : 'Kartu E-Toll'}
                                </th>
                                <th scope="col" className="text-left py-3.5 px-4 text-xs uppercase tracking-wider font-semibold text-slate-500">Jenis</th>
                                <th scope="col" className="text-right py-3.5 px-4 text-xs uppercase tracking-wider font-semibold text-slate-500">Nominal</th>
                                <th scope="col" className="text-right py-3.5 px-4 text-xs uppercase tracking-wider font-semibold text-slate-500">Saldo Awal & Akhir</th>
                                <th scope="col" className="text-left py-3.5 px-4 text-xs uppercase tracking-wider font-semibold text-slate-500">Otorisator</th>
                                <th scope="col" className="text-left py-3.5 px-6 text-xs uppercase tracking-wider font-semibold text-slate-500 w-60">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody key={`${activeTab}-${currentPage}`} className="divide-y divide-gray-100 animate-in fade-in duration-150 ease-out">
                            {paginatedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                                                {activeTab === 'operational' ? (
                                                    <Wallet className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
                                                ) : (
                                                    <CreditCard className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {activeTab === 'operational' ? 'Buku Kas Kosong' : 'Riwayat E-Toll Kosong'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 max-w-sm">
                                                {activeTab === 'operational'
                                                    ? 'Belum ada aktivitas mutasi dana operasional yang tercatat.'
                                                    : 'Belum ada aktivitas mutasi saldo kartu E-Toll yang tercatat.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {format(new Date(log.created_at), 'dd MMM yyyy', { locale: id })}
                                                </span>
                                                <span className="text-xs text-slate-500 tabular-nums">
                                                    {format(new Date(log.created_at), 'HH:mm:ss', { locale: id })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-xs text-slate-700 uppercase shrink-0">
                                                    {log.subjectName.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{log.subjectName}</p>
                                                    <p className="text-xs text-slate-500">{log.subjectType}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            {getActionBadge(log.action_type)}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className={`text-sm font-semibold tabular-nums tracking-tight ${
                                                log.amount > 0 ? 'text-emerald-700' : 'text-rose-700'
                                            }`}>
                                                {log.amount > 0 ? '+' : ''}{formatCurrency(log.amount)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 text-xs">
                                                <span className="text-slate-400 tabular-nums line-through decoration-slate-300">
                                                    {formatCurrency(log.previous_balance)}
                                                </span>
                                                <span className="text-slate-400">→</span>
                                                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                                                    {formatCurrency(log.new_balance)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 uppercase">
                                                    {log.adminName.charAt(0)}
                                                </div>
                                                <span className="text-xs font-medium text-slate-700">{log.adminName}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed" title={log.description}>
                                                {log.description || '-'}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List (Optimized for iPhone & Android Touch) */}
                <div key={`${activeTab}-${currentPage}`} className="md:hidden divide-y divide-gray-100 animate-in fade-in duration-150 ease-out">
                    {paginatedLogs.length === 0 ? (
                        <div className="py-12 px-5 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                                {activeTab === 'operational' ? (
                                    <Wallet className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
                                ) : (
                                    <CreditCard className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
                                )}
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                                {activeTab === 'operational' ? 'Buku Kas Kosong' : 'Riwayat E-Toll Kosong'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm">
                                {activeTab === 'operational'
                                    ? 'Belum ada catatan mutasi kas operasional.'
                                    : 'Belum ada catatan mutasi saldo kartu E-Toll.'}
                            </p>
                        </div>
                    ) : (
                        paginatedLogs.map(log => (
                            <div key={log.id} className="p-4 sm:p-5 flex flex-col gap-3">
                                {/* Header: Subject & Badge */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-xs text-slate-700 uppercase shrink-0 select-none">
                                            {log.subjectName.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 tracking-tight leading-snug">
                                                {log.subjectName}
                                            </h3>
                                            <p className="text-xs font-semibold text-slate-500">{log.subjectType}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {getActionBadge(log.action_type)}
                                    </div>
                                </div>

                                {/* Transaction Info Box */}
                                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500">Waktu</p>
                                        <p className="text-xs font-semibold text-slate-900 tabular-nums">
                                            {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Nominal</p>
                                        <span className={`text-base font-bold tabular-nums tracking-tight ${
                                            log.amount > 0 ? 'text-emerald-700' : 'text-rose-700'
                                        }`}>
                                            {log.amount > 0 ? '+' : ''}{formatCurrency(log.amount)}
                                        </span>
                                    </div>
                                </div>

                                {/* Balance Flow */}
                                <div className="flex items-center justify-between text-xs px-1">
                                    <div>
                                        <span className="text-slate-500">Saldo Awal: </span>
                                        <span className="font-semibold text-slate-700 tabular-nums">
                                            {formatCurrency(log.previous_balance)}
                                        </span>
                                    </div>
                                    <span className="text-slate-400">→</span>
                                    <div>
                                        <span className="text-slate-500">Saldo Akhir: </span>
                                        <span className="font-bold text-blue-600 tabular-nums">
                                            {formatCurrency(log.new_balance)}
                                        </span>
                                    </div>
                                </div>

                                {/* Description & Admin Footer */}
                                {log.description && (
                                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                        <p className="font-semibold text-slate-700 mb-0.5">Keterangan</p>
                                        <p className="leading-relaxed">{log.description}</p>
                                    </div>
                                )}

                                <div className="flex items-center gap-1.5 text-xs text-slate-500 select-none">
                                    <span>Otorisator:</span>
                                    <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-[10px] font-bold text-slate-700 uppercase">
                                        {log.adminName.charAt(0)}
                                    </div>
                                    <span className="font-semibold text-slate-700">{log.adminName}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Footer with Mobile-Native 44px Hit Targets & Insets */}
                {totalPages > 1 && (
                    <nav
                        aria-label="Navigasi halaman riwayat transaksi"
                        className="px-4 sm:px-6 py-3.5 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))]"
                    >
                        <p className="text-xs text-slate-500 font-medium order-2 sm:order-1 select-none">
                            Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari <span className="font-bold text-slate-900">{totalPages}</span>
                        </p>

                        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 order-1 sm:order-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-4 py-2 min-h-[44px] text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 touch-manipulation select-none"
                                aria-label="Halaman sebelumnya"
                            >
                                <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                                <span>Sebelumnya</span>
                            </button>

                            {/* Page numbers (Desktop only) */}
                            <div className="hidden sm:flex items-center gap-1 select-none">
                                {visiblePages.map((item, idx) => {
                                    if (item === 'ellipsis') {
                                        return (
                                            <span key={`ellipsis-${idx}`} className="px-2 text-xs text-slate-400 select-none">
                                                …
                                            </span>
                                        );
                                    }
                                    const isCurrent = item === currentPage;
                                    return (
                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() => setCurrentPage(item)}
                                            aria-current={isCurrent ? 'page' : undefined}
                                            aria-label={`Ke halaman ${item}`}
                                            className={`min-w-[40px] h-10 text-xs font-semibold rounded-lg transition-all active:scale-[0.96] touch-manipulation ${
                                                isCurrent
                                                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            {item}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-4 py-2 min-h-[44px] text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.96] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 touch-manipulation select-none"
                                aria-label="Halaman berikutnya"
                            >
                                <span>Berikutnya</span>
                                <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                            </button>
                        </div>
                    </nav>
                )}
            </div>
        </div>
    );
}
