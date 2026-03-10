import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { ApiService } from '../../services/api';
import DateRangePicker from '../../components/ui/DateRangePicker';
import type { LogbookEntry } from '../../types';
import { BookOpen, CheckCircle, XCircle, Clock, Eye, Trash2, FileSpreadsheet, FileText, X, ChevronLeft, ChevronRight, ArrowUpNarrowWide, ArrowDownNarrowWide, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Select from '../../components/ui/Select';
import { useToast } from '../../context/ToastContext';
import { SkeletonLogbookList } from '../../components/ui/Skeleton';
import { PAGE_SIZE } from '../../constants';
import { useActiveEtollsQuery, useUnitsQuery, useUsersQuery } from '../../hooks/useReferenceDataQueries';

// PDF Layout Constants
const PDF_MARGIN_LEFT = 14;
const PDF_TITLE_Y = 20;
const PDF_SUBTITLE_Y = 28;
const PDF_TABLE_START_Y = 35;
const PDF_GRAND_TOTAL_OFFSET = 10;

export default function LogbookList() {
    const { showToast } = useToast();
    const { data: users = [] } = useUsersQuery();
    const { data: units = [] } = useUnitsQuery();
    const { data: etolls = [] } = useActiveEtollsQuery();
    const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
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
            draft: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200/60', label: 'Draft', icon: Clock },
            submitted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', label: 'Pending', icon: Clock },
            approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60', label: 'Disetujui', icon: CheckCircle },
            rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/60', label: 'Ditolak', icon: XCircle }
        };
        const statusConfig = config[status] || config.submitted;
        const { bg, text, border, label, icon: Icon } = statusConfig;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-widest font-bold border ${bg} ${text} ${border}`}>
                <Icon className="h-3 w-3" aria-hidden="true" />
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
        const XLSX = await import('xlsx');
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
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable')
        ]);
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
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50/50 to-transparent rounded-bl-full -mr-20 -mt-20 pointer-events-none" />
                <div className="flex items-center gap-5 relative">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100/50 flex items-center justify-center shadow-inner relative overflow-hidden group-hover:shadow-md transition-shadow duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <BookOpen className="h-7 w-7 text-blue-600 relative z-10" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Laporan Harian</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Kelola & pantau <span className="font-bold text-gray-700 tabular-nums">{totalCount}</span> laporan operasional</p>
                    </div>
                </div>
                <div className="flex gap-2 relative">
                    <button
                        onClick={exportToPDF}
                        disabled={exportLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded-xl ring-1 ring-inset ring-rose-200/60 hover:ring-rose-300 transition-all duration-300 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        aria-label="Export ke PDF"
                    >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        {exportLoading ? 'Loading…' : 'PDF'}
                    </button>
                    <button
                        onClick={exportToExcel}
                        disabled={exportLoading}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all duration-300"
                        aria-label="Export ke Excel"
                    >
                        <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                        {exportLoading ? 'Loading…' : 'Excel'}
                    </button>
                </div>
            </div>

            {/* Filters Command Center */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-sm border border-gray-100/60 p-6 md:p-8 relative z-20 ring-1 ring-inset ring-blue-50/50">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-100/20 to-transparent pointer-events-none rounded-t-[2rem]" />
                <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent pointer-events-none" />

                <div className="flex justify-between items-center mb-6 relative">
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-blue-900/70">Filter & Pencarian</span>
                    </div>
                    <button onClick={clearFilters} className="text-[10px] uppercase font-bold tracking-wider text-blue-600 hover:text-blue-800 transition-colors duration-200">Reset Filter</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative">
                    {/* Driver Filter */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Driver</label>
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
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Unit Kendaraan</label>
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
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">User (Tamu/Client)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200"
                                placeholder="Cari nama…"
                                value={filterClient}
                                onChange={(e) => { setFilterClient(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                    {/* Date Filters */}
                    <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1 mb-1.5">Rentang Tanggal</label>
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6 mt-6 border-t border-gray-100 relative">
                    {/* Status Tabs */}
                    <div className="flex flex-wrap bg-gray-100/80 p-1 rounded-xl gap-1 flex-1" role="tablist" aria-label="Filter status laporan">
                        {(['all', 'submitted', 'approved', 'rejected'] as const).map(f => (
                            <button
                                key={f}
                                role="tab"
                                aria-selected={statusFilter === f}
                                onClick={() => { setStatusFilter(f); setPage(1); }}
                                className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all duration-200 ${statusFilter === f
                                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-inset ring-blue-100/50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                    }`}
                            >
                                {f === 'all' ? 'Semua' : f === 'submitted' ? 'Pending' : f === 'approved' ? 'Disetujui' : 'Ditolak'}
                            </button>
                        ))}
                    </div>

                    {/* SORT TOGGLE */}
                    <button
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-[10px] uppercase tracking-wider font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 whitespace-nowrap"
                    >
                        {sortOrder === 'desc' ? (
                            <>
                                <ArrowDownNarrowWide className="h-4 w-4 text-blue-600" aria-hidden="true" />
                                <span>Terbaru</span>
                            </>
                        ) : (
                            <>
                                <ArrowUpNarrowWide className="h-4 w-4 text-amber-600" aria-hidden="true" />
                                <span>Terlama</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

            {/* Table Area - Hidden on mobile */}
            <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr>
                                <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Tanggal</th>
                                <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Unit</th>
                                <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Driver</th>
                                <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">User</th>
                                <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Rute</th>
                                <th className="text-right py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Biaya</th>
                                <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Status</th>
                                <th className="text-center py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y divide-gray-50 ${loading ? 'opacity-50' : ''}`}>
                            {logbooks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-16 border-none">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                                                <Search className="h-6 w-6 text-gray-300" aria-hidden="true" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nihil Data</p>
                                            <p className="text-xs text-gray-400">Coba ubah filter pencarian Anda</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logbooks.map(log => (
                                    <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                        <td className="py-4 px-6 border-none whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-900 tabular-nums">{format(new Date(log.date), 'dd MMM yyyy', { locale: id })}</span>
                                        </td>
                                        <td className="py-4 px-6 border-none whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase">{getUnitName(log.unit_id)}</span>
                                            <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest mt-0.5">{getUnitPlate(log.unit_id)}</span>
                                        </td>
                                        <td className="py-4 px-6 border-none whitespace-nowrap text-sm font-medium text-gray-600">{getDriverName(log.driver_id)}</td>
                                        <td className="py-4 px-6 border-none text-sm text-gray-900">{log.client_name}</td>
                                        <td className="py-4 px-6 border-none text-sm text-gray-600 max-w-[200px] truncate" title={log.rute}>{log.rute}</td>
                                        <td className="py-4 px-6 border-none text-right">
                                            <span className="text-[13px] font-bold text-gray-900 tabular-nums tracking-tight">{formatCurrency(log.toll_cost + log.operational_cost)}</span>
                                        </td>
                                        <td className="py-4 px-6 border-none">{getStatusBadge(log.status)}</td>
                                        <td className="py-4 px-6 border-none">
                                            <div className="flex justify-center gap-1">
                                                <button onClick={() => setSelectedLogbook(log)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors duration-200" aria-label="Lihat detail laporan">
                                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                                {log.status === 'submitted' && (
                                                    <>
                                                        <button onClick={() => handleApprove(log.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors duration-200" aria-label="Setujui laporan">
                                                            <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                                        </button>
                                                        <button onClick={() => handleReject(log.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors duration-200" aria-label="Tolak laporan">
                                                            <XCircle className="h-4 w-4" aria-hidden="true" />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => setDeleteLogbook(log)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors duration-200" aria-label="Hapus laporan">
                                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
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
                <div className="border-t border-gray-50 p-6 bg-gradient-to-r from-gray-50/30 to-white flex items-center justify-between">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                        {totalCount === 0 ? (
                            'Tidak ada data'
                        ) : (
                            <>Menampilkan <span className="font-black text-gray-700 tabular-nums">{(page - 1) * pageSize + 1}</span> – <span className="font-black text-gray-700 tabular-nums">{Math.min(page * pageSize, totalCount)}</span> dari <span className="font-black text-gray-700 tabular-nums">{totalCount}</span></>
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
                                className="p-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors duration-200"
                                aria-label="Halaman sebelumnya"
                            >
                                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
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
                                        className={`w-9 h-9 rounded-xl text-xs font-bold tabular-nums transition-all duration-200 ${page === p ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || totalPages === 0}
                                className="p-2 rounded-xl border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50 transition-colors duration-200"
                                aria-label="Halaman selanjutnya"
                            >
                                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Cards - Show on mobile only */}
            <div className="md:hidden space-y-4">
                {logbooks.length === 0 ? (
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 text-center">
                        <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-4" aria-hidden="true" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nihil Data</p>
                    </div>
                ) : (
                    <>
                        {logbooks.map(log => (
                            <div key={log.id} className="bg-white rounded-[20px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100/50 p-6 flex flex-col transition-all duration-300">
                                {/* Header Area */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-1.5">
                                            {format(new Date(log.date), 'EEEE, dd MMM', { locale: id })}
                                        </span>
                                        <h3 className="text-[20px] font-black text-gray-900 tracking-tight leading-none mb-2">
                                            {getDriverName(log.driver_id)}
                                        </h3>
                                        <span className="block text-[13px] font-bold text-gray-500">
                                            {getUnitName(log.unit_id)} · {getUnitPlate(log.unit_id)}
                                        </span>
                                    </div>
                                    <div className="scale-[0.85] origin-top-right shrink-0">
                                        {getStatusBadge(log.status)}
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-6">
                                    <div>
                                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-1">Penyewa</span>
                                        <span className="block text-sm font-bold text-gray-900 line-clamp-1 leading-snug">{log.client_name}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-1">Rute</span>
                                        <span className="block text-sm font-bold text-gray-900 line-clamp-1 leading-snug">{log.rute}</span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px w-full bg-gradient-to-r from-gray-100 via-gray-100 to-transparent mb-5" />

                                {/* Cost Section (Clean, no background) */}
                                <div className="grid grid-cols-3 gap-2 items-end mb-6">
                                    <div>
                                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-1">Tol & Parkir</span>
                                        <span className="block text-[13px] font-bold text-gray-700 tabular-nums">{formatCurrency(log.toll_cost)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-1">Opr. Lain</span>
                                        <span className="block text-[13px] font-bold text-gray-700 tabular-nums">{formatCurrency(log.operational_cost)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-blue-600 mb-1">Total Biaya</span>
                                        <span className="block text-[15px] font-black text-blue-700 tabular-nums leading-none tracking-tight">
                                            {formatCurrency(log.toll_cost + log.operational_cost)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Area */}
                                <div className="mt-auto flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-50/80">
                                    <button onClick={() => setSelectedLogbook(log)} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all duration-200 font-extrabold text-[11px] uppercase tracking-wider">
                                        Detail
                                    </button>
                                    {log.status === 'submitted' && (
                                        <>
                                            <button onClick={() => handleApprove(log.id)} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all duration-200 font-extrabold text-[11px] uppercase tracking-wider">
                                                Setujui
                                            </button>
                                            <button onClick={() => handleReject(log.id)} className="px-4 py-2 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-xl transition-all duration-200 font-extrabold text-[11px] uppercase tracking-wider">
                                                Tolak
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => setDeleteLogbook(log)} className="px-4 py-2 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-xl transition-all duration-200 font-extrabold text-[11px] uppercase tracking-wider">
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                        {/* Mobile Pagination */}
                        <div className="flex justify-between items-center bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 tabular-nums">Hal <span className="font-black text-gray-700">{page}</span> / <span className="font-black text-gray-700">{totalPages}</span></span>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-200 rounded-xl disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 hover:bg-gray-50">Sebelumnya</button>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 hover:bg-blue-700 shadow-sm">Selanjutnya</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {deleteLogbook && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Hapus Laporan?</h2>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            Apakah Anda yakin ingin menghapus laporan tanggal <strong className="font-black">{format(new Date(deleteLogbook.date), 'dd MMMM yyyy', { locale: id })}</strong> dari <strong className="font-black">{deleteLogbook.client_name}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteLogbook(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-sm transition-colors duration-200">Batal</button>
                            <button onClick={handleDelete} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-bold text-sm shadow-md shadow-rose-500/20 transition-all duration-200">Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedLogbook && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto shadow-2xl" style={{ overscrollBehavior: 'contain' }}>
                        <button onClick={() => setSelectedLogbook(null)} className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200" aria-label="Tutup detail">
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>

                        <h2 className="text-xl font-black tracking-tight mb-6">Detail Laporan</h2>

                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tanggal</p>
                                    <p className="text-sm font-bold text-gray-900 tabular-nums">{format(new Date(selectedLogbook.date), 'EEEE, dd MMMM yyyy', { locale: id })}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                    {getStatusBadge(selectedLogbook.status)}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Driver</p>
                                    <p className="text-sm font-bold text-gray-900">{getDriverName(selectedLogbook.driver_id)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unit</p>
                                    <p className="text-sm font-bold text-gray-900">{getUnitName(selectedLogbook.unit_id)} ({getUnitPlate(selectedLogbook.unit_id)})</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">E-Toll</p>
                                    <p className="text-sm font-bold text-gray-900">{getEtollInfo(selectedLogbook.etoll_id)}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-5 space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">User (Tamu/Client)</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedLogbook.client_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rute</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedLogbook.rute}</p>
                                </div>
                                {selectedLogbook.keterangan && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Keterangan</p>
                                        <p className="text-sm text-gray-700 bg-gray-50/80 p-4 rounded-xl border border-gray-100">{selectedLogbook.keterangan}</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-100/40 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Biaya Tol</span>
                                    <span className="text-sm font-bold text-blue-800 tabular-nums">{formatCurrency(selectedLogbook.toll_cost)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Biaya Lain</span>
                                    <span className="text-sm font-bold text-blue-800 tabular-nums">{formatCurrency(selectedLogbook.operational_cost)}</span>
                                </div>
                                <div className="border-t border-blue-200/50 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Total Biaya</span>
                                    <span className="text-3xl font-black text-blue-700 tabular-nums tracking-tighter">{formatCurrency(selectedLogbook.toll_cost + selectedLogbook.operational_cost)}</span>
                                </div>
                            </div>

                            {selectedLogbook.status === 'submitted' && (
                                <div className="flex gap-3 pt-4 border-t border-gray-100">
                                    <button onClick={() => handleApprove(selectedLogbook.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm shadow-md shadow-emerald-500/20 transition-all duration-200">
                                        <CheckCircle className="h-4 w-4" aria-hidden="true" /> Setujui
                                    </button>
                                    <button onClick={() => handleReject(selectedLogbook.id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-bold text-sm shadow-md shadow-rose-500/20 transition-all duration-200">
                                        <XCircle className="h-4 w-4" aria-hidden="true" /> Tolak
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
