import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { LogbookEntry, User, Unit } from '../../types';
import { BookOpen, CheckCircle, XCircle, Clock, Eye, Trash2, FileSpreadsheet, FileText, X, ChevronLeft, ChevronRight, ArrowUpNarrowWide, ArrowDownNarrowWide, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { useToast } from '../../context/ToastContext';
import { SkeletonLogbookList } from '../../components/ui/Skeleton';
import { PAGE_SIZE } from '../../constants';

export default function LogbookList() {
    const { showToast } = useToast();
    const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [error, setError] = useState('');

    // Server-side State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZE);
    const [totalCount, setTotalCount] = useState(0);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('all');
    const [filterDriver, setFilterDriver] = useState('');
    const [filterUnit, setFilterUnit] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    // Modal State
    const [selectedLogbook, setSelectedLogbook] = useState<LogbookEntry | null>(null);
    const [deleteLogbook, setDeleteLogbook] = useState<LogbookEntry | null>(null);

    // Initial Load (Users & Units)
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [usersData, unitsData] = await Promise.all([
                    ApiService.getUsers(),
                    ApiService.getUnits()
                ]);
                setUsers(usersData);
                setUnits(unitsData);
            } catch (err) {
                console.error('Failed to fetch metadata:', err);
            }
        };
        fetchMetadata();
    }, []);

    // Fetch Logbooks (Server-side Filter & Pagination)
    useEffect(() => {
        const fetchLogbooks = async () => {
            setLoading(true);
            try {
                const { data, count } = await ApiService.getLogbooksPaginated({
                    page,
                    pageSize,
                    driverId: filterDriver || undefined,
                    unitId: filterUnit || undefined,
                    clientName: filterClient || undefined,
                    dateStart: filterDateStart || undefined,
                    dateEnd: filterDateEnd || undefined,
                    status: statusFilter,
                    sortOrder
                });
                setLogbooks(data);
                setTotalCount(count);
            } catch (err) {
                setError('Gagal memuat data laporan');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search client name
        const timeoutId = setTimeout(() => {
            fetchLogbooks();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [page, pageSize, sortOrder, statusFilter, filterDriver, filterUnit, filterClient, filterDateStart, filterDateEnd]);

    const getDriverName = (driverId: string) => users.find(u => u.id === driverId)?.full_name || '-';
    const getUnitName = (unitId: string) => units.find(u => u.id === unitId)?.name || '-';
    const getUnitPlate = (unitId: string) => units.find(u => u.id === unitId)?.plate_number || '-';

    // Format: "Reborn (L 1379 LN)" - Last word of name + Plate
    const getUnitShortName = (unitId: string) => {
        const u = units.find(u => u.id === unitId);
        if (!u) return '-';
        const lastWord = u.name.trim().split(' ').pop() || u.name;
        return `${lastWord} (${u.plate_number})`;
    };

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

    // Helper to fetch ALL data for export
    const fetchAllForExport = async () => {
        setExportLoading(true);
        try {
            const { data } = await ApiService.getLogbooksPaginated({
                page: 1,
                pageSize: 5000,
                driverId: filterDriver || undefined,
                unitId: filterUnit || undefined,
                clientName: filterClient || undefined,
                dateStart: filterDateStart || undefined,
                dateEnd: filterDateEnd || undefined,
                status: statusFilter,
                sortOrder
            });
            return data;
        } catch (err) {
            showToast('error', 'Gagal memuat data export');
            return [];
        } finally {
            setExportLoading(false);
        }
    };

    const exportToExcel = async () => {
        const data = await fetchAllForExport();
        if (data.length === 0) return;

        const excelData = data.map(log => ({
            'Tanggal': format(new Date(log.date), 'dd/MM/yyyy'),
            'Unit': getUnitShortName(log.unit_id),
            'Driver': getDriverName(log.driver_id),
            'User (Tamu/Client)': log.client_name,
            'Rute': log.rute,
            'Keterangan': log.keterangan || '-',
            'Biaya Tol': log.toll_cost,
            'Biaya Lain': log.operational_cost,
            'Total Biaya': log.toll_cost + log.operational_cost,
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        // Adjust column widths
        const wscols = [
            { wch: 12 }, // Tanggal
            { wch: 30 }, // Unit
            { wch: 20 }, // Driver
            { wch: 20 }, // User
            { wch: 30 }, // Rute
            { wch: 20 }, // Keterangan
            { wch: 15 }, // Tol
            { wch: 15 }, // Parkir
            { wch: 15 }  // Total
        ];
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
        const filename = `Laporan_Harian_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    const exportToPDF = async () => {
        const data = await fetchAllForExport();
        if (data.length === 0) return;

        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(18);
        doc.text('Laporan Harian Kendaraan', 14, 20);

        doc.setFontSize(10);
        let filterInfo = `Tanggal Export: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`;
        if (filterDateStart || filterDateEnd) {
            filterInfo += ` | Periode: ${filterDateStart || 'Awal'} s/d ${filterDateEnd || 'Akhir'}`;
        }
        doc.text(filterInfo, 14, 28);

        // Headers: Tanggal | Unit | Driver | User | Rute | Tol | Biaya Lain | Total
        const headers = ['Tanggal', 'Unit', 'Driver', 'User', 'Rute', 'Tol', 'Biaya Lain', 'Total'];
        const colWidths = [22, 40, 30, 30, 60, 25, 25, 25];
        let y = 38;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let x = 14;
        headers.forEach((header, i) => {
            doc.text(header, x, y);
            x += colWidths[i];
        });

        doc.setFont('helvetica', 'normal');
        y += 6;

        data.forEach((log) => {
            if (y > 180) {
                doc.addPage();
                y = 20;
            }
            x = 14;

            // Format: Short Name (Plate) e.g. "Reborn (L 1379 LN)"
            const unitShort = getUnitShortName(log.unit_id);

            const rowSimple = [
                format(new Date(log.date), 'dd/MM/yy'),
                unitShort,
                getDriverName(log.driver_id).substring(0, 15),
                log.client_name.substring(0, 15),
                log.rute.substring(0, 35),
                formatCurrency(log.toll_cost),
                formatCurrency(log.operational_cost),
                formatCurrency(log.toll_cost + log.operational_cost)
            ];

            rowSimple.forEach((cell, i) => {
                doc.text(cell, x, y);
                x += colWidths[i];
            });
            y += 6;
        });

        // Add Grand Total
        y += 4;
        const totalAll = data.reduce((sum, l) => sum + l.toll_cost + l.operational_cost, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`Grand Total: ${formatCurrency(totalAll)}`, 14, y);

        const filename = `Laporan_Harian_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        doc.save(filename);
    };

    const clearFilters = () => {
        setFilterDriver('');
        setFilterUnit('');
        setFilterClient('');
        setFilterDateStart('');
        setFilterDateEnd('');
        setStatusFilter('all');
        setPage(1);
    };

    if (loading && logbooks.length === 0) {
        return <SkeletonLogbookList />;
    }

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manajemen Laporan Harian</h1>
                        <p className="text-sm text-gray-500">Total {totalCount} laporan</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToExcel}
                        disabled={exportLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        {exportLoading ? '...' : 'Export Excel'}
                    </button>
                    <button
                        onClick={exportToPDF}
                        disabled={exportLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        <FileText className="h-4 w-4" />
                        {exportLoading ? '...' : 'Export PDF'}
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-700">Filter & Pencarian</h3>
                    <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">Reset Filter</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Driver Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Driver</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                            value={filterDriver}
                            onChange={(e) => { setFilterDriver(e.target.value); setPage(1); }}
                        >
                            <option value="">Semua Driver</option>
                            {drivers.map(d => (
                                <option key={d.id} value={d.id}>{d.full_name}</option>
                            ))}
                        </select>
                    </div>
                    {/* Unit Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                            value={filterUnit}
                            onChange={(e) => { setFilterUnit(e.target.value); setPage(1); }}
                        >
                            <option value="">Semua Unit</option>
                            {units.map(u => (
                                <option key={u.id} value={u.id}>{u.name} - {u.plate_number}</option>
                            ))}
                        </select>
                    </div>
                    {/* Client Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">User (Tamu/Client)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                                placeholder="Cari nama..."
                                value={filterClient}
                                onChange={(e) => { setFilterClient(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                    {/* Date Filters */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                            value={filterDateStart}
                            onChange={(e) => { setFilterDateStart(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                            value={filterDateEnd}
                            onChange={(e) => { setFilterDateEnd(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>

                {/* Status & Sort Section */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-dashed">
                    {/* Status Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['all', 'submitted', 'approved', 'rejected'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => { setStatusFilter(f); setPage(1); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === f
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {f === 'all' ? 'Semua' : f === 'submitted' ? 'Pending' : f === 'approved' ? 'Disetujui' : 'Ditolak'}
                            </button>
                        ))}
                    </div>

                    {/* SORT TOGGLE */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">Urutkan Tanggal:</span>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            {sortOrder === 'desc' ? (
                                <>
                                    <ArrowDownNarrowWide className="h-4 w-4 text-blue-600" />
                                    <span>Terbaru Dulu</span>
                                </>
                            ) : (
                                <>
                                    <ArrowUpNarrowWide className="h-4 w-4 text-orange-600" />
                                    <span>Terlama Dulu</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

            {/* Table Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tanggal</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Unit</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Driver</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">User</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rute</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Biaya</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className={loading ? 'opacity-50' : ''}>
                            {logbooks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Search className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <p className="text-gray-500 font-medium">Tidak ada data ditemukan</p>
                                            <p className="text-sm text-gray-400">Coba ubah filter pencarian Anda</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logbooks.map(log => (
                                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-gray-900 whitespace-nowrap">
                                            {format(new Date(log.date), 'dd MMM yyyy', { locale: id })}
                                        </td>
                                        <td className="py-3 px-4 text-gray-900 whitespace-nowrap">
                                            <span className="font-medium">{getUnitName(log.unit_id)}</span>
                                            <span className="text-xs text-gray-500 block">{getUnitPlate(log.unit_id)}</span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{getDriverName(log.driver_id)}</td>
                                        <td className="py-3 px-4 text-gray-900">{log.client_name}</td>
                                        <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate" title={log.rute}>{log.rute}</td>
                                        <td className="py-3 px-4 text-gray-900 font-medium">{formatCurrency(log.toll_cost + log.operational_cost)}</td>
                                        <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-center gap-1">
                                                <button onClick={() => setSelectedLogbook(log)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {log.status === 'submitted' && (
                                                    <>
                                                        <button onClick={() => handleStatusChange(log.id, 'approved')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleStatusChange(log.id, 'rejected')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => setDeleteLogbook(log)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
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

                {/* PAGINATION */}
                <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Menampilkan <span className="font-medium">{(page - 1) * pageSize + 1}</span> - <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> dari <span className="font-medium">{totalCount}</span> data
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="10">10 / page</option>
                            <option value="20">20 / page</option>
                            <option value="50">50 / page</option>
                            <option value="100">100 / page</option>
                        </select>

                        <div className="flex gap-1 ml-4">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let p = page;
                                if (page < 3) p = i + 1;
                                else if (page > totalPages - 2) p = totalPages - 4 + i;
                                else p = page - 2 + i;

                                if (p < 1 || p > totalPages) return null;

                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || totalPages === 0}
                                className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {deleteLogbook && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Hapus Laporan?</h2>
                        <p className="text-gray-600 mb-6">
                            Apakah Anda yakin ingin menghapus laporan tanggal <strong>{format(new Date(deleteLogbook.date), 'dd MMMM yyyy', { locale: id })}</strong> dari <strong>{deleteLogbook.client_name}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteLogbook(null)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Batal</button>
                            <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedLogbook && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setSelectedLogbook(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
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
                            {/* ... rest of the modal ... */}
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

                            <div className="bg-blue-50 p-4 rounded-lg border-t space-y-2">
                                <div className="flex justify-between items-center text-sm text-blue-800">
                                    <span>Biaya Tol:</span>
                                    <span>{formatCurrency(selectedLogbook.toll_cost)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-blue-800">
                                    <span>Biaya Lain:</span>
                                    <span>{formatCurrency(selectedLogbook.operational_cost)}</span>
                                </div>
                                <div className="border-t border-blue-200 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-blue-900">Total Biaya:</span>
                                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(selectedLogbook.toll_cost + selectedLogbook.operational_cost)}</span>
                                </div>
                            </div>

                            {selectedLogbook.status === 'submitted' && (
                                <div className="flex gap-3 pt-4 border-t">
                                    <button onClick={() => handleStatusChange(selectedLogbook.id, 'approved')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        <CheckCircle className="h-4 w-4" /> Setujui
                                    </button>
                                    <button onClick={() => handleStatusChange(selectedLogbook.id, 'rejected')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                        <XCircle className="h-4 w-4" /> Tolak
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
