import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { LogbookEntry, User, Unit } from '../../types';
import { BookOpen, CheckCircle, XCircle, Clock, Eye, X, Trash2, FileSpreadsheet, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { useToast } from '../../context/ToastContext';
import { SkeletonLogbookList } from '../../components/ui/Skeleton';

export default function LogbookList() {
    const { showToast } = useToast();
    const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLogbook, setSelectedLogbook] = useState<LogbookEntry | null>(null);
    const [deleteLogbook, setDeleteLogbook] = useState<LogbookEntry | null>(null);
    const [filter, setFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');

    // Advanced Filters
    const [filterDriver, setFilterDriver] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

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
                setError('Gagal memuat data laporan');
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

    // Get unique drivers (only drivers)
    const drivers = users.filter(u => u.role === 'driver');

    const handleStatusChange = async (logbookId: string, status: LogbookEntry['status']) => {
        try {
            await ApiService.updateLogbookStatus(logbookId, status);

            const logbook = logbooks.find(l => l.id === logbookId);
            if (logbook) {
                const statusText = status === 'approved' ? 'disetujui' : 'ditolak';
                await ApiService.createNotification({
                    user_id: logbook.driver_id,
                    type: status === 'approved' ? 'logbook_approved' : 'logbook_rejected',
                    title: `Laporan ${status === 'approved' ? 'Disetujui' : 'Ditolak'}`,
                    message: `Laporan tanggal ${new Date(logbook.date).toLocaleDateString('id-ID')} telah ${statusText} oleh admin`,
                    link: '/driver/history'
                });
            }

            setLogbooks(logbooks.map(l => l.id === logbookId ? { ...l, status } : l));
            setSelectedLogbook(null);
            showToast('success', status === 'approved' ? 'Laporan berhasil disetujui' : 'Laporan berhasil ditolak');
        } catch (err) {
            showToast('error', 'Gagal mengubah status laporan');
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!deleteLogbook) return;
        try {
            await ApiService.deleteLogbook(deleteLogbook.id);
            setLogbooks(logbooks.filter(l => l.id !== deleteLogbook.id));
            setDeleteLogbook(null);
            showToast('success', 'Laporan berhasil dihapus');
        } catch (err) {
            showToast('error', 'Gagal menghapus laporan');
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

    // Apply all filters
    const filteredLogbooks = logbooks.filter(l => {
        // Status filter
        if (filter !== 'all' && l.status !== filter) return false;

        // Driver filter
        if (filterDriver && l.driver_id !== filterDriver) return false;

        // Client filter
        if (filterClient && !l.client_name.toLowerCase().includes(filterClient.toLowerCase())) return false;

        // Date range filter
        if (filterDateStart && new Date(l.date) < new Date(filterDateStart)) return false;
        if (filterDateEnd && new Date(l.date) > new Date(filterDateEnd)) return false;

        return true;
    });

    // Export to Excel
    const exportToExcel = () => {
        const data = filteredLogbooks.map(log => ({
            'Tanggal': format(new Date(log.date), 'dd/MM/yyyy'),
            'Driver': getDriverName(log.driver_id),
            'Unit': getUnitName(log.unit_id),
            'Plat Nomor': getUnitPlate(log.unit_id),
            'User (Tamu/Client)': log.client_name,
            'Rute': log.rute,
            'Keterangan': log.keterangan,
            'Biaya Tol & Parkir': log.toll_parking_cost,
            'Status': log.status === 'approved' ? 'Disetujui' : log.status === 'rejected' ? 'Ditolak' : 'Pending'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan');

        const filename = `Laporan_Harian_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF({ orientation: 'landscape' });

        // Title
        doc.setFontSize(18);
        doc.text('Laporan Harian Kendaraan', 14, 20);

        // Filter info
        doc.setFontSize(10);
        let filterInfo = `Tanggal Export: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`;
        if (filterDateStart || filterDateEnd) {
            filterInfo += ` | Periode: ${filterDateStart || 'Awal'} s/d ${filterDateEnd || 'Akhir'}`;
        }
        doc.text(filterInfo, 14, 28);

        // Table header
        const headers = ['Tanggal', 'Driver', 'User', 'Rute', 'Biaya', 'Status'];
        const colWidths = [25, 40, 50, 70, 35, 25];
        let y = 38;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let x = 14;
        headers.forEach((header, i) => {
            doc.text(header, x, y);
            x += colWidths[i];
        });

        // Table rows
        doc.setFont('helvetica', 'normal');
        y += 6;

        filteredLogbooks.forEach((log) => {
            if (y > 180) {
                doc.addPage();
                y = 20;
            }

            x = 14;
            const row = [
                format(new Date(log.date), 'dd/MM/yy'),
                getDriverName(log.driver_id).substring(0, 20),
                log.client_name.substring(0, 25),
                log.rute.substring(0, 35),
                formatCurrency(log.toll_parking_cost),
                log.status === 'approved' ? 'OK' : log.status === 'rejected' ? 'Tolak' : 'Pending'
            ];

            row.forEach((cell, i) => {
                doc.text(cell, x, y);
                x += colWidths[i];
            });
            y += 6;
        });

        // Total
        y += 4;
        const totalCost = filteredLogbooks.reduce((sum, l) => sum + l.toll_parking_cost, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: ${filteredLogbooks.length} laporan | Total Biaya: ${formatCurrency(totalCost)}`, 14, y);

        const filename = `Laporan_Harian_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        doc.save(filename);
    };

    const clearFilters = () => {
        setFilterDriver('');
        setFilterClient('');
        setFilterDateStart('');
        setFilterDateEnd('');
        setFilter('all');
    };

    if (loading) {
        return <SkeletonLogbookList />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Laporan Harian</h1>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Export Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        <FileText className="h-4 w-4" />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-700">Filter</h3>
                    <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">Reset Filter</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Driver</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            value={filterDriver}
                            onChange={(e) => setFilterDriver(e.target.value)}
                        >
                            <option value="">Semua Driver</option>
                            {drivers.map(d => (
                                <option key={d.id} value={d.id}>{d.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">User (Tamu/Client)</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Cari nama client..."
                            value={filterClient}
                            onChange={(e) => setFilterClient(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Dari Tanggal</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            value={filterDateStart}
                            onChange={(e) => setFilterDateStart(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Sampai Tanggal</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            value={filterDateEnd}
                            onChange={(e) => setFilterDateEnd(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="flex gap-2 pt-2 border-t">
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
                    <span className="ml-auto text-sm text-gray-500 self-center">
                        {filteredLogbooks.length} laporan ditemukan
                    </span>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

            {/* Delete Modal */}
            {deleteLogbook && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Hapus Laporan?</h2>
                        <p className="text-gray-600 mb-6">
                            Apakah Anda yakin ingin menghapus laporan tanggal <strong>{format(new Date(deleteLogbook.date), 'dd MMMM yyyy', { locale: id })}</strong> dari <strong>{deleteLogbook.client_name}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteLogbook(null)}
                                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedLogbook && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedLogbook(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-4">Detail Laporan</h2>

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

                            <div className="border-t pt-4 space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">User (Tamu/Client)</p>
                                    <p className="font-medium text-gray-900">{selectedLogbook.client_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Rute</p>
                                    <p className="font-medium text-gray-900">{selectedLogbook.rute}</p>
                                </div>
                                {selectedLogbook.keterangan && (
                                    <div>
                                        <p className="text-sm text-gray-500">Keterangan</p>
                                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedLogbook.keterangan}</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border-t">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-blue-900">Biaya Tol & Parkir:</span>
                                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(selectedLogbook.toll_parking_cost)}</span>
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
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">User</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rute</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Biaya</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogbooks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">
                                        Tidak ada logbook yang sesuai filter
                                    </td>
                                </tr>
                            ) : (
                                filteredLogbooks.map(log => (
                                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-gray-900">
                                            {format(new Date(log.date), 'dd MMM yyyy', { locale: id })}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">{getDriverName(log.driver_id)}</td>
                                        <td className="py-3 px-4 text-gray-900">{log.client_name}</td>
                                        <td className="py-3 px-4 text-gray-600">{log.rute}</td>
                                        <td className="py-3 px-4 text-gray-900">{formatCurrency(log.toll_parking_cost)}</td>
                                        <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-center gap-1">
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
                                                <button
                                                    onClick={() => setDeleteLogbook(log)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
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
        </div>
    );
}
