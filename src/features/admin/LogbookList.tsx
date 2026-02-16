import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { ApiService } from '../../services/api';
import DateRangePicker from '../../components/ui/DateRangePicker';
import type { LogbookEntry, User, Unit, Etoll } from '../../types';
import { BookOpen, CheckCircle, XCircle, Clock, Eye, Trash2, FileSpreadsheet, FileText, X, ChevronLeft, ChevronRight, ArrowUpNarrowWide, ArrowDownNarrowWide, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Select from '../../components/ui/Select';
import { useToast } from '../../context/ToastContext';
import { SkeletonLogbookList } from '../../components/ui/Skeleton';
import { PAGE_SIZE } from '../../constants';

// PDF Layout Constants
const PDF_MARGIN_LEFT = 14;
const PDF_TITLE_Y = 20;
const PDF_SUBTITLE_Y = 28;
const PDF_TABLE_START_Y = 35;
const PDF_GRAND_TOTAL_OFFSET = 10;

export default function LogbookList() {
    const { showToast } = useToast();
    const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [etolls, setEtolls] = useState<Etoll[]>([]);
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

    // Realtime trigger: increments when DB changes, causing useEffect to re-fetch
    const [realtimeTrigger, setRealtimeTrigger] = useState(0);
    const handleRealtimeUpdate = useCallback(() => setRealtimeTrigger(prev => prev + 1), []);
    useRealtimeSubscription({
        table: 'logbooks',
        events: ['INSERT', 'UPDATE', 'DELETE'],
        onUpdate: handleRealtimeUpdate,
    });

    // Initial Load (Users & Units)
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [usersData, unitsData, etollsData] = await Promise.all([
                    ApiService.getUsers(),
                    ApiService.getUnits(),
                    ApiService.getActiveEtolls()
                ]);
                setUsers(usersData);
                setUnits(unitsData);
                setEtolls(etollsData);
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
    }, [page, pageSize, sortOrder, statusFilter, filterDriver, filterUnit, filterClient, filterDateStart, filterDateEnd, realtimeTrigger]);

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const unitMap = useMemo(() => new Map(units.map(u => [u.id, u])), [units]);

    const getDriverName = (driverId: string) => userMap.get(driverId)?.full_name || '-';
    // const getUnitName = (unitId: string) => unitMap.get(unitId)?.name || '-'; // Unused
    const getUnitName = (unitId: string) => unitMap.get(unitId)?.name || '-';
    const getUnitPlate = (unitId: string) => unitMap.get(unitId)?.plate_number || '-';

    // Format: "Reborn (L 1379 LN)" - Last word of name + Plate
    const getUnitShortName = (unitId: string) => {
        const u = unitMap.get(unitId);
        if (!u) return '-';
        const lastWord = u.name.trim().split(' ').pop() || u.name;
        return `${lastWord} (${u.plate_number})`;
    };

    const getEtollInfo = (etollId?: string) => {
        if (!etollId) return 'Tidak menggunakan E-Toll';
        const etoll = etolls.find(e => e.id === etollId);
        return etoll ? `${etoll.card_name} (${etoll.card_number || '-'})` : 'E-Toll tidak ditemukan';
    };

    const drivers = users.filter(u => u.role === 'driver');

    const handleApprove = async (logbookId: string) => {
        try {
            const logbook = logbooks.find(l => l.id === logbookId);
            if (!logbook) return;

            await ApiService.updateLogbookStatus(logbookId, 'approved');

            await ApiService.createNotification({
                user_id: logbook.driver_id,
                type: 'logbook_approved',
                title: 'Laporan Disetujui',
                message: `Laporan tanggal ${new Date(logbook.date).toLocaleDateString('id-ID')} telah disetujui oleh admin`,
                link: '/driver/history'
            });

            setLogbooks(logbooks.map(l => l.id === logbookId ? { ...l, status: 'approved' } : l));
            if (selectedLogbook?.id === logbookId) {
                setSelectedLogbook({ ...selectedLogbook, status: 'approved' });
            } else {
                setSelectedLogbook(null);
            }
            showToast('success', 'Laporan berhasil disetujui');
        } catch (err) {
            showToast('error', 'Gagal menyetujui laporan');
            console.error(err);
        }
    };

    const handleReject = async (logbookId: string) => {
        try {
            const logbook = logbooks.find(l => l.id === logbookId);
            if (!logbook) return;

            await ApiService.updateLogbookStatus(logbookId, 'rejected');

            await ApiService.createNotification({
                user_id: logbook.driver_id,
                type: 'logbook_rejected',
                title: 'Laporan Ditolak',
                message: `Laporan tanggal ${new Date(logbook.date).toLocaleDateString('id-ID')} telah ditolak oleh admin`,
                link: '/driver/history'
            });

            setLogbooks(logbooks.map(l => l.id === logbookId ? { ...l, status: 'rejected' } : l));
            if (selectedLogbook?.id === logbookId) {
                setSelectedLogbook({ ...selectedLogbook, status: 'rejected' });
            } else {
                setSelectedLogbook(null);
            }
            showToast('success', 'Laporan berhasil ditolak');
        } catch (err) {
            showToast('error', 'Gagal menolak laporan');
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

    // Build dynamic filename based on active filters
    const sanitizeFilename = (str: string) => str.replace(/[^a-zA-Z0-9\-]/g, '-').replace(/-+/g, '-');

    const buildExportFilename = (ext: 'pdf' | 'xlsx') => {
        const parts = ['Laporan_Harian'];

        // Add driver name if filtered
        if (filterDriver) {
            const driverName = sanitizeFilename(getDriverName(filterDriver));
            parts.push(driverName);
        }

        // Add unit name if filtered
        if (filterUnit) {
            const unitName = sanitizeFilename(getUnitName(filterUnit));
            parts.push(unitName);
        }

        // Add date range if filtered
        if (filterDateStart && filterDateEnd) {
            parts.push(`${filterDateStart}_${filterDateEnd}`);
        } else if (filterDateStart) {
            parts.push(`dari-${filterDateStart}`);
        } else if (filterDateEnd) {
            parts.push(`sampai-${filterDateEnd}`);
        } else {
            // Default: export date
            parts.push(format(new Date(), 'yyyy-MM-dd'));
        }

        // Add status if not "all"
        if (statusFilter !== 'all') {
            parts.push(statusFilter);
        }

        return `${parts.join('_')}.${ext}`;
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
        XLSX.writeFile(wb, buildExportFilename('xlsx'));
    };

    const exportToPDF = async () => {
        const data = await fetchAllForExport();
        if (data.length === 0) return;

        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(18);
        doc.text('Laporan Harian Kendaraan', PDF_MARGIN_LEFT, PDF_TITLE_Y);

        doc.setFontSize(10);
        let filterInfo = `Tanggal Export: ${format(new Date(), 'dd MMMM yyyy', { locale: id })}`;
        if (filterDateStart || filterDateEnd) {
            filterInfo += ` | Periode: ${filterDateStart || 'Awal'} s/d ${filterDateEnd || 'Akhir'}`;
        }
        doc.text(filterInfo, PDF_MARGIN_LEFT, PDF_SUBTITLE_Y);

        // Prepare table data
        const tableData = data.map(log => [
            format(new Date(log.date), 'dd/MM/yy'),
            getUnitShortName(log.unit_id),
            getDriverName(log.driver_id),
            log.client_name,
            log.rute,
            formatCurrency(log.toll_cost),
            formatCurrency(log.operational_cost),
            formatCurrency(log.toll_cost + log.operational_cost)
        ]);

        // Generate table with autoTable
        autoTable(doc, {
            startY: PDF_TABLE_START_Y,
            head: [['Tanggal', 'Unit', 'Driver', 'User', 'Rute', 'Tol', 'Biaya Lain', 'Total']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [59, 130, 246], // Blue-500
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 8
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 20 }, // Tanggal
                1: { cellWidth: 35 }, // Unit
                2: { cellWidth: 30 }, // Driver
                3: { cellWidth: 30 }, // User
                4: { cellWidth: 55 }, // Rute
                5: { halign: 'right', cellWidth: 25 }, // Tol
                6: { halign: 'right', cellWidth: 25 }, // Biaya Lain
                7: { halign: 'right', cellWidth: 25, fontStyle: 'bold' } // Total
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252] // Gray-50
            },
            margin: { left: PDF_MARGIN_LEFT, right: PDF_MARGIN_LEFT }
        });

        // Add Grand Total after table
        const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + PDF_GRAND_TOTAL_OFFSET;
        const totalAll = data.reduce((sum, l) => sum + l.toll_cost + l.operational_cost, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Grand Total: ${formatCurrency(totalAll)}`, PDF_MARGIN_LEFT, finalY);

        doc.save(buildExportFilename('pdf'));
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
                        onClick={exportToPDF}
                        disabled={exportLoading}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        <FileText className="h-4 w-4" />
                        {exportLoading ? '...' : 'PDF'}
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={exportLoading}
                        className="flex items-center gap-2 px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        {exportLoading ? '...' : 'Excel'}
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-700">Filter & Pencarian</h3>
                    <button onClick={clearFilters} className="text-sm text-blue-600 hover:underline">Reset Filter</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Driver Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Driver</label>
                        <Select
                            value={filterDriver}
                            onChange={(val) => { setFilterDriver(val); setPage(1); }}
                            options={[
                                { value: '', label: 'Semua Driver' },
                                ...drivers.map(d => ({ value: d.id, label: d.full_name }))
                            ]}
                            placeholder="Semua Driver"
                        />
                    </div>
                    {/* Unit Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                        <Select
                            value={filterUnit}
                            onChange={(val) => { setFilterUnit(val); setPage(1); }}
                            options={[
                                { value: '', label: 'Semua Unit' },
                                ...units.map(u => ({ value: u.id, label: `${u.name} - ${u.plate_number}` }))
                            ]}
                            placeholder="Semua Unit"
                        />
                    </div>
                    {/* Client Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">User (Tamu/Client)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors"
                                placeholder="Cari nama..."
                                value={filterClient}
                                onChange={(e) => { setFilterClient(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                    {/* Date Filters */}
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Rentang Tanggal</label>
                        <DateRangePicker
                            startDate={filterDateStart}
                            endDate={filterDateEnd}
                            onChange={(start, end) => {
                                setFilterDateStart(start);
                                setFilterDateEnd(end);
                                setPage(1);
                            }}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Status & Sort Section */}
                <div className="flex flex-col gap-4 pt-4 border-t border-dashed">
                    {/* Status Tabs */}
                    <div className="flex flex-wrap bg-gray-100 p-1 rounded-lg gap-1">
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
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
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

            {/* Table Area - Hidden on mobile */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full min-w-[800px]">
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
                                                <button onClick={() => setSelectedLogbook(log)} className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {log.status === 'submitted' && (
                                                    <>
                                                        <button onClick={() => handleApprove(log.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleReject(log.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => setDeleteLogbook(log)} className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
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
                        {totalCount === 0 ? (
                            'Tidak ada data'
                        ) : (
                            <>Menampilkan <span className="font-medium">{(page - 1) * pageSize + 1}</span> - <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span> dari <span className="font-medium">{totalCount}</span> data</>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-32">
                            <Select
                                value={String(pageSize)}
                                onChange={(val) => { setPageSize(Number(val)); setPage(1); }}
                                position="top"
                                options={[
                                    { value: "10", label: "10 / page" },
                                    { value: "20", label: "20 / page" },
                                    { value: "50", label: "50 / page" },
                                    { value: "100", label: "100 / page" }
                                ]}
                            />
                        </div>

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

            {/* Mobile Cards - Show on mobile only */}
            <div className="md:hidden space-y-4">
                {logbooks.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Tidak ada data ditemukan</p>
                    </div>
                ) : (
                    <>
                        {logbooks.map(log => (
                            <div key={log.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {format(new Date(log.date), 'EEEE, dd MMMM yyyy', { locale: id })}
                                        </p>
                                        <p className="text-sm text-gray-500">{getUnitName(log.unit_id)} ({getUnitPlate(log.unit_id)})</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(log.status)}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-3">
                                    <div className="flex">
                                        <span className="text-gray-500 w-20">Driver:</span>
                                        <span className="text-gray-900 font-medium">{getDriverName(log.driver_id)}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-gray-500 w-20">User:</span>
                                        <span className="text-gray-900">{log.client_name}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-gray-500 w-20">Rute:</span>
                                        <span className="text-gray-900">{log.rute}</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-3 rounded-lg space-y-1">
                                    <div className="flex justify-between items-center text-sm text-blue-800">
                                        <span>Biaya Tol:</span>
                                        <span>{formatCurrency(log.toll_cost)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-blue-800">
                                        <span>Biaya Lain:</span>
                                        <span>{formatCurrency(log.operational_cost)}</span>
                                    </div>
                                    <div className="border-t border-blue-200 my-1"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-700 font-medium">Total:</span>
                                        <span className="font-bold text-blue-700">{formatCurrency(log.toll_cost + log.operational_cost)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                                    <button onClick={() => setSelectedLogbook(log)} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium">
                                        Detail
                                    </button>
                                    {log.status === 'submitted' && (
                                        <>
                                            <button onClick={() => handleApprove(log.id)} className="px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium">
                                                Setujui
                                            </button>
                                            <button onClick={() => handleReject(log.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium">
                                                Tolak
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => setDeleteLogbook(log)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium">
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                        {/* Mobile Pagination */}
                        <div className="flex justify-between items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <span className="text-sm text-gray-500">Halaman {page} dari {totalPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-lg disabled:opacity-50 text-sm">Sebelumnya</button>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded-lg disabled:opacity-50 text-sm">Selanjutnya</button>
                            </div>
                        </div>
                    </>
                )}
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
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-500">E-Toll</p>
                                    <p className="font-medium">{getEtollInfo(selectedLogbook.etoll_id)}</p>
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
                                    <button onClick={() => handleApprove(selectedLogbook.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        <CheckCircle className="h-4 w-4" /> Setujui
                                    </button>
                                    <button onClick={() => handleReject(selectedLogbook.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
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
