import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { BalanceLog, EtollLog, User, Etoll } from '../../types';
import { FileText, Wallet, TrendingUp, TrendingDown, RotateCcw, Edit, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { SkeletonManagementList } from '../../components/ui/Skeleton';

export default function TransactionLogsPage() {
    const [activeTab, setActiveTab] = useState<'operational' | 'etoll'>('operational');
    const [balanceLogs, setBalanceLogs] = useState<BalanceLog[]>([]);
    const [etollLogs, setEtollLogs] = useState<EtollLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [etolls, setEtolls] = useState<Etoll[]>([]); // To resolve E-Toll names
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [balanceData, etollData, usersData, etollsData] = await Promise.all([
                    ApiService.getBalanceLogs(),
                    ApiService.getEtollLogs(),
                    ApiService.getUsers(),
                    ApiService.getEtolls() // Assuming this exists or returns active + inactive
                ]);
                setBalanceLogs(balanceData);
                setEtollLogs(etollData);
                setUsers(usersData);
                setEtolls(etollsData);
            } catch (err) {
                console.error('Failed to fetch transaction logs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const getUserName = (userId?: string) => {
        if (!userId) return 'System';
        const user = users.find(u => u.id === userId);
        return user ? user.full_name : 'Unknown User';
    };

    const getEtollName = (etollId: string) => {
        const etoll = etolls.find(e => e.id === etollId);
        return etoll ? `${etoll.card_name}` : 'Unknown E-Toll';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const getActionBadge = (type: string) => {
        switch (type) {
            case 'top_up':
                return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"><TrendingUp className="h-3 w-3" /> Top Up</span>;
            case 'deduct':
                return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium"><TrendingDown className="h-3 w-3" /> Pengurangan</span>;
            case 'edit':
                return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"><Edit className="h-3 w-3" /> Edit Manual</span>;
            case 'reset':
                return <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"><RotateCcw className="h-3 w-3" /> Reset</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{type}</span>;
        }
    };

    if (loading) return <SkeletonManagementList />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('operational')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'operational'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Wallet className="h-4 w-4" />
                        Uang Operasional
                    </button>
                    <button
                        onClick={() => setActiveTab('etoll')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'etoll'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <CreditCard className="h-4 w-4" />
                        E-Toll
                    </button>
                </nav>
            </div>

            {/* Operational Logs Table */}
            {activeTab === 'operational' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tanggal</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Driver</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Jumlah</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Saldo Awal</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Saldo Akhir</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Admin</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {balanceLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-500">Belum ada riwayat transaksi</td>
                                    </tr>
                                ) : (
                                    balanceLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm text-gray-900 whitespace-nowrap">
                                                {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{getUserName(log.driver_id)}</td>
                                            <td className="py-3 px-4 text-sm">{getActionBadge(log.action_type)}</td>
                                            <td className={`py-3 px-4 text-sm text-right font-medium ${log.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {log.amount > 0 ? '+' : ''}{formatCurrency(log.amount)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-500">{formatCurrency(log.previous_balance)}</td>
                                            <td className="py-3 px-4 text-sm text-right font-bold text-gray-900">{formatCurrency(log.new_balance)}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{getUserName(log.admin_id)}</td>
                                            <td className="py-3 px-4 text-sm text-gray-500 max-w-[200px] truncate" title={log.description}>
                                                {log.description}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* E-Toll Logs Table */}
            {activeTab === 'etoll' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tanggal</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kartu E-Toll</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Jumlah</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Saldo Awal</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Saldo Akhir</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Admin</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Keterangan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {etollLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-500">Belum ada riwayat transaksi</td>
                                    </tr>
                                ) : (
                                    etollLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm text-gray-900 whitespace-nowrap">
                                                {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{getEtollName(log.etoll_id)}</td>
                                            <td className="py-3 px-4 text-sm">{getActionBadge(log.action_type)}</td>
                                            <td className={`py-3 px-4 text-sm text-right font-medium ${log.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {log.amount > 0 ? '+' : ''}{formatCurrency(log.amount)}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right text-gray-500">{formatCurrency(log.previous_balance)}</td>
                                            <td className="py-3 px-4 text-sm text-right font-bold text-gray-900">{formatCurrency(log.new_balance)}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{getUserName(log.admin_id)}</td>
                                            <td className="py-3 px-4 text-sm text-gray-500 max-w-[200px] truncate" title={log.description}>
                                                {log.description}
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
