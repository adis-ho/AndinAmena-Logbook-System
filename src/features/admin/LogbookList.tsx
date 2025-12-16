import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { LogbookEntry, User, Unit } from '../../types';
import { BookOpen, CheckCircle, XCircle, Clock, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function LogbookList() {
    const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLogbook, setSelectedLogbook] = useState<LogbookEntry | null>(null);
    const [filter, setFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [logsData, usersData, unitsData] = await Promise.all([
                    ApiService.getLogbooks(),
                    ApiService.getUsers(),
                    ApiService.getUnits()
                ]);
                setLogbooks(logsData);
                setUsers(usersData);
                setUnits(unitsData);
            } catch (err) {
                setError('Gagal memuat data logbook');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getDriverName = (driverId: string) => users.find(u => u.id === driverId)?.full_name || '-';
    const getUnitName = (unitId: string) => units.find(u => u.id === unitId)?.name || '-';
    const getUnitPlate = (unitId: string) => units.find(u => u.id === unitId)?.plate_number || '-';

    const handleStatusChange = async (logbookId: string, status: LogbookEntry['status']) => {
        try {
            await ApiService.updateLogbookStatus(logbookId, status);

            // Find the logbook to get driver info
            const logbook = logbooks.find(l => l.id === logbookId);
            if (logbook) {
                const statusText = status === 'approved' ? 'disetujui' : 'ditolak';

                // Notify the driver about status change
                await ApiService.createNotification({
                    user_id: logbook.driver_id,
                    type: status === 'approved' ? 'logbook_approved' : 'logbook_rejected',
                    title: `Logbook ${status === 'approved' ? 'Disetujui' : 'Ditolak'}`,
                    message: `Logbook tanggal ${new Date(logbook.date).toLocaleDateString('id-ID')} telah ${statusText} oleh admin`,
                    link: '/driver/history'
                });
            }

            setLogbooks(logbooks.map(l => l.id === logbookId ? { ...l, status } : l));
            setSelectedLogbook(null);
        } catch (err) {
            alert('Gagal mengubah status');
            console.error(err);
        }
    };

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

    const filteredLogbooks = filter === 'all'
        ? logbooks
        : logbooks.filter(l => l.status === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Logbook</h1>
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                    {(['all', 'submitted', 'approved', 'rejected'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f === 'all' ? 'Semua' : f === 'submitted' ? 'Pending' : f === 'approved' ? 'Disetujui' : 'Ditolak'}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

            {/* Detail Modal */}
            {selectedLogbook && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedLogbook(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-4">Detail Logbook</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Tanggal</p>
                                    <p className="font-medium">{format(new Date(selectedLogbook.date), 'EEEE, dd MMMM yyyy', { locale: id })}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    {getStatusBadge(selectedLogbook.status)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Driver</p>
                                    <p className="font-medium">{getDriverName(selectedLogbook.driver_id)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Unit</p>
                                    <p className="font-medium">{getUnitName(selectedLogbook.unit_id)} ({getUnitPlate(selectedLogbook.unit_id)})</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="text-sm text-gray-500 mb-2">Kegiatan</p>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedLogbook.activities}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 border-t pt-4">
                                <div>
                                    <p className="text-sm text-gray-500">KM Awal</p>
                                    <p className="font-medium">{selectedLogbook.start_km.toLocaleString()} km</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">KM Akhir</p>
                                    <p className="font-medium">{selectedLogbook.end_km.toLocaleString()} km</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total KM</p>
                                    <p className="font-bold text-blue-600">{selectedLogbook.total_km.toLocaleString()} km</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">BBM</p>
                                    <p className="font-medium">{formatCurrency(selectedLogbook.fuel_cost)}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Tol</p>
                                    <p className="font-medium">{formatCurrency(selectedLogbook.toll_cost)}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Parkir</p>
                                    <p className="font-medium">{formatCurrency(selectedLogbook.parking_cost)}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Lainnya</p>
                                    <p className="font-medium">{formatCurrency(selectedLogbook.other_cost)}</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border-t">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-blue-900">Total Biaya:</span>
                                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(selectedLogbook.total_cost)}</span>
                                </div>
                            </div>

                            {selectedLogbook.status === 'submitted' && (
                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => handleStatusChange(selectedLogbook.id, 'approved')}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        Setujui
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(selectedLogbook.id, 'rejected')}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Tolak
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tanggal</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Driver</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Unit</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">KM</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Biaya</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogbooks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        Belum ada logbook
                                    </td>
                                </tr>
                            ) : (
                                filteredLogbooks.map(log => (
                                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-gray-900">
                                            {format(new Date(log.date), 'dd MMM yyyy', { locale: id })}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">{getDriverName(log.driver_id)}</td>
                                        <td className="py-3 px-4 text-gray-600">{getUnitName(log.unit_id)}</td>
                                        <td className="py-3 px-4 text-gray-900">{log.total_km} km</td>
                                        <td className="py-3 px-4 text-gray-900">{formatCurrency(log.total_cost)}</td>
                                        <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedLogbook(log)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {log.status === 'submitted' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(log.id, 'approved')}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Setujui"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(log.id, 'rejected')}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Tolak"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
