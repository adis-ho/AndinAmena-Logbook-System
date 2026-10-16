import { useEffect, useState, useMemo } from 'react';
import { ApiService } from '../../services/api';
import DateRangePicker from '../../components/ui/DateRangePicker';
import type { LogbookEntry } from '../../types';
import { ArrowUpNarrowWide, ArrowDownNarrowWide, FileSpreadsheet, FileText, FileSearch } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
// import { id } from 'date-fns/locale'; // Unused
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/calculations';
import { SkeletonDriverSummary } from '../../components/ui/Skeleton';

import Select from '../../components/ui/Select';
import { useUnitsQuery, useUsersQuery } from '../../hooks/useReferenceDataQueries';

// PDF Layout Constants
const PDF_MARGIN_LEFT = 14;
const PDF_TITLE_Y = 20;
const PDF_SUBTITLE_Y = 28;
const PDF_TABLE_START_Y = 35;
// const PDF_GRAND_TOTAL_OFFSET = 10; // Unused for now in this report

interface DriverStats {
    driverId: string;
    driverName: string;
    totalTrips: number;
    totalToll: number;
    totalOperational: number;
    totalCost: number;
    balance: number; // Placeholder for now if not available in API
}

export default function DriverSummary() {
    const { showToast } = useToast();
    const { data: usersData = [], isLoading: usersLoading } = useUsersQuery();
    const { data: unitsData = [], isLoading: unitsLoading } = useUnitsQuery();
    const driverOptions = useMemo(
        () => usersData
            .filter(user => user.role === 'driver' && user.status === 'active')
            .map(user => ({ value: user.id, label: user.full_name })),
        [usersData]
    );
    const [loading, setLoading] = useState(true);
    const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);

    // Filters
    const [dateStart, setDateStart] = useState<string>(
        format(startOfMonth(new Date()), 'yyyy-MM-dd')
    );
    const [dateEnd, setDateEnd] = useState<string>(
        format(endOfMonth(new Date()), 'yyyy-MM-dd')
    );
    const [filterDriver, setFilterDriver] = useState('');
    const [filterUnit, setFilterUnit] = useState('');

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: keyof DriverStats; direction: 'asc' | 'desc' } | null>({ key: 'totalCost', direction: 'desc' });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const logbooksData = await ApiService.getAllLogbooks(dateStart, dateEnd);
                setLogbooks(logbooksData);
            } catch (err) {
                console.error('Failed to fetch summary data:', err);
                showToast('error', 'Gagal memuat data ringkasan');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateStart, dateEnd]);

    // Aggregate Data
    const driverStats = useMemo(() => {
        const statsMap = new Map<string, DriverStats>();
        const activeDrivers = usersData.filter(u => u.role === 'driver' && u.status === 'active');

        // Initialize with all active drivers
        activeDrivers.forEach(user => {
            // Apply driver filter if selected
            if (filterDriver && user.id !== filterDriver) return;

            statsMap.set(user.id, {
                driverId: user.id,
                driverName: user.full_name,
                totalTrips: 0,
                totalToll: 0,
                totalOperational: 0,
                totalCost: 0,
                balance: 0 // TODO: Need specific endpoint or logic for balance if not in logbook
            });
        });

        // Sum up logbooks - ONLY count approved logbooks
        logbooks.forEach(log => {
            // Skip if not approved
            if (log.status !== 'approved') return;

            // Skip if driver filtered out
            if (filterDriver && log.driver_id !== filterDriver) return;

            // Skip if unit filtered out
            if (filterUnit && log.unit_id !== filterUnit) return;

            const stats = statsMap.get(log.driver_id);
            if (stats) {
                stats.totalTrips += 1;
                stats.totalToll += log.toll_cost;
                stats.totalOperational += log.operational_cost;
                stats.totalCost += (log.toll_cost + log.operational_cost);
            }
        });

        const result = Array.from(statsMap.values());

        // Sort
        if (sortConfig) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [usersData, logbooks, sortConfig, filterDriver, filterUnit]);


    // Overall Totals
    const overallStats = useMemo(() => {
        return driverStats.reduce((acc, curr) => ({
            drivers: driverStats.length,
            trips: acc.trips + curr.totalTrips,
            cost: acc.cost + curr.totalCost,
            avgCost: driverStats.length > 0 ? (acc.cost + curr.totalCost) / driverStats.length : 0
        }), { drivers: 0, trips: 0, cost: 0, avgCost: 0 });
    }, [driverStats]);

    // Handlers
    const handleSort = (key: keyof DriverStats) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };



    // Export Logic
    const sanitizeFilename = (str: string) => str.replace(/[^a-zA-Z0-9\-]/g, '-').replace(/-+/g, '-');

    const buildExportFilename = (ext: 'pdf' | 'xlsx') => {
        // Use sanitizeFilename if we ever add dynamic parts like user input. 
        // For now dateStart/End are safe, but good practice to keep the helper.
        return `Ringkasan_Driver_${sanitizeFilename(dateStart)}_${sanitizeFilename(dateEnd)}.${ext}`;
    };

    const exportToExcel = async () => {
        const XLSX = await import('xlsx');
        const dataToExport = driverStats.map((stat, index) => ({
            'No': index + 1,
            'Nama Driver': stat.driverName,
            'Total Trip': stat.totalTrips,
            'Biaya Tol': stat.totalToll,
            'Biaya Lain': stat.totalOperational,
            'Total Biaya': stat.totalCost,
            // 'Saldo': stat.balance
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, 'Ringkasan Driver');
        XLSX.writeFile(wb, buildExportFilename('xlsx'));
    };

    const exportToPDF = async () => {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable')
        ]);
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(18);
        doc.text('Ringkasan Performa Driver', PDF_MARGIN_LEFT, PDF_TITLE_Y);

        doc.setFontSize(10);
        const filterInfo = `Periode: ${dateStart} s/d ${dateEnd} | Export: ${format(new Date(), 'dd MMM yyyy')}`;
        doc.text(filterInfo, PDF_MARGIN_LEFT, PDF_SUBTITLE_Y);

        const tableData = driverStats.map((stat, index) => [
            index + 1,
            stat.driverName,
            stat.totalTrips,
            formatCurrency(stat.totalToll),
            formatCurrency(stat.totalOperational),
            formatCurrency(stat.totalCost),
            // formatCurrency(stat.balance)
        ]);

        autoTable(doc, {
            startY: PDF_TABLE_START_Y,
            head: [['No', 'Nama Driver', 'Total Trip', 'Biaya Tol', 'Biaya Lain', 'Total Biaya']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right', fontStyle: 'bold' }
            },
            margin: { left: PDF_MARGIN_LEFT, right: PDF_MARGIN_LEFT }
        });

        doc.save(buildExportFilename('pdf'));
    };

    if ((loading && logbooks.length === 0) || usersLoading || unitsLoading) {
        return <SkeletonDriverSummary />;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-6">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Ringkasan Driver</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Statistik performa dan biaya operasional per pengemudi</p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                        onClick={exportToPDF}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-rose-50 hover:bg-rose-100 active:scale-[0.98] border border-rose-200 text-rose-700 rounded-xl font-medium text-xs uppercase tracking-wider transition-all shadow-sm touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        aria-label="Cetak ringkasan ke format PDF"
                    >
                        <FileText className="h-4 w-4 text-rose-600 shrink-0" aria-hidden="true" />
                        <span>Export PDF</span>
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] border border-emerald-200 text-emerald-800 rounded-xl font-medium text-xs uppercase tracking-wider transition-all shadow-sm touch-manipulation select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        aria-label="Cetak ringkasan ke format Excel"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    {/* Driver Filter */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600">Filter Driver</label>
                        <Select
                            value={filterDriver}
                            onChange={setFilterDriver}
                            options={[
                                { value: '', label: 'Semua Driver' },
                                ...driverOptions
                            ]}
                            placeholder="Pilih Driver"
                        />
                    </div>

                    {/* Unit Filter */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600">Filter Kendaraan</label>
                        <Select
                            value={filterUnit}
                            onChange={setFilterUnit}
                            options={[
                                { value: '', label: 'Semua Unit' },
                                ...unitsData.map(u => ({ value: u.id, label: `${u.name} (${u.plate_number})` }))
                            ]}
                            placeholder="Pilih Unit"
                        />
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                        <label className="block text-xs font-medium text-slate-600">Rentang Waktu</label>
                        <DateRangePicker
                            startDate={dateStart}
                            endDate={dateEnd}
                            onChange={(start, end) => {
                                setDateStart(start);
                                setDateEnd(end);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Total Driver</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums tracking-tight">{overallStats.drivers}</p>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Trip Selesai</p>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums tracking-tight">{overallStats.trips}</span>
                        <span className="text-xs font-medium text-slate-500">trip</span>
                    </div>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Total Pengeluaran</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums tracking-tight truncate">{formatCurrency(overallStats.cost)}</p>
                </div>

                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Rata-rata / Driver</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums tracking-tight truncate">{formatCurrency(Math.round(overallStats.cost / (overallStats.drivers || 1)))}</p>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
                {driverStats.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-12 px-6 text-center">
                        <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FileSearch className="h-7 w-7 text-gray-300" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">Belum ada statistik driver</p>
                        <p className="text-xs font-normal text-slate-500 mt-1">Coba sesuaikan filter atau rentang waktu.</p>
                    </div>
                ) : (
                    driverStats.map((stat, index) => (
                        <div key={stat.driverId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
                            {/* Header Area */}
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                                        <span className="text-xs font-semibold text-slate-700 uppercase">
                                            {stat.driverName.substring(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
                                            <h3 className="text-base font-bold text-gray-900 line-clamp-1">{stat.driverName}</h3>
                                        </div>
                                        <span className="block text-xs font-medium text-slate-500 mt-0.5">ID: {stat.driverId.substring(0, 8)}</span>
                                    </div>
                                </div>
                                <span className="inline-flex bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums">
                                    {stat.totalTrips} trip
                                </span>
                            </div>

                            {/* Flat Clean Breakdown */}
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs">
                                <div>
                                    <span className="block font-medium text-slate-500">Tol & Parkir</span>
                                    <span className="block font-semibold text-gray-900 tabular-nums mt-0.5">{formatCurrency(stat.totalToll)}</span>
                                </div>
                                <div>
                                    <span className="block font-medium text-slate-500">Biaya Lain</span>
                                    <span className="block font-semibold text-gray-900 tabular-nums mt-0.5">{formatCurrency(stat.totalOperational)}</span>
                                </div>
                            </div>

                            {/* Total Cost Row */}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Biaya</span>
                                <span className="font-bold text-base text-gray-900 tabular-nums">{formatCurrency(stat.totalCost)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Summary Table - Desktop Only */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th scope="col" className="py-4 px-4 text-center w-14 text-xs uppercase tracking-wider font-bold text-gray-600 border-none">No</th>
                                <th scope="col" className="py-4 px-6 text-left border-none" aria-sort={sortConfig?.key === 'driverName' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                                    <button
                                        onClick={() => handleSort('driverName')}
                                        className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-gray-600 hover:text-blue-600 active:scale-[0.98] transition-all rounded px-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        aria-label={`Urutkan berdasarkan nama driver ${sortConfig?.key === 'driverName' && sortConfig.direction === 'asc' ? '(naik)' : '(turun)'}`}
                                    >
                                        <span>Identitas Driver</span>
                                        {sortConfig?.key === 'driverName' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownNarrowWide className="h-3.5 w-3.5" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th scope="col" className="py-4 px-6 text-center w-32 border-none" aria-sort={sortConfig?.key === 'totalTrips' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                                    <button
                                        onClick={() => handleSort('totalTrips')}
                                        className="flex items-center justify-center gap-1.5 w-full text-xs uppercase tracking-wider font-bold text-gray-600 hover:text-blue-600 active:scale-[0.98] transition-all rounded px-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        aria-label={`Urutkan berdasarkan jumlah trip ${sortConfig?.key === 'totalTrips' && sortConfig.direction === 'asc' ? '(naik)' : '(turun)'}`}
                                    >
                                        <span>Trip Selesai</span>
                                        {sortConfig?.key === 'totalTrips' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownNarrowWide className="h-3.5 w-3.5" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th scope="col" className="py-4 px-6 text-right w-40 border-none" aria-sort={sortConfig?.key === 'totalToll' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                                    <button
                                        onClick={() => handleSort('totalToll')}
                                        className="flex items-center justify-end gap-1.5 w-full text-xs uppercase tracking-wider font-bold text-gray-600 hover:text-blue-600 active:scale-[0.98] transition-all rounded px-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        aria-label={`Urutkan berdasarkan biaya tol ${sortConfig?.key === 'totalToll' && sortConfig.direction === 'asc' ? '(naik)' : '(turun)'}`}
                                    >
                                        <span>Tol & Parkir</span>
                                        {sortConfig?.key === 'totalToll' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownNarrowWide className="h-3.5 w-3.5" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th scope="col" className="py-4 px-6 text-right w-36 border-none" aria-sort={sortConfig?.key === 'totalOperational' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                                    <button
                                        onClick={() => handleSort('totalOperational')}
                                        className="flex items-center justify-end gap-1.5 w-full text-xs uppercase tracking-wider font-bold text-gray-600 hover:text-blue-600 active:scale-[0.98] transition-all rounded px-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        aria-label={`Urutkan berdasarkan biaya lain ${sortConfig?.key === 'totalOperational' && sortConfig.direction === 'asc' ? '(naik)' : '(turun)'}`}
                                    >
                                        <span>Biaya Lain</span>
                                        {sortConfig?.key === 'totalOperational' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownNarrowWide className="h-3.5 w-3.5" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th scope="col" className="py-4 px-6 text-right w-44 border-none" aria-sort={sortConfig?.key === 'totalCost' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                                    <button
                                        onClick={() => handleSort('totalCost')}
                                        className="flex items-center justify-end gap-1.5 w-full text-xs uppercase tracking-wider font-bold text-gray-600 hover:text-gray-900 active:scale-[0.98] transition-all rounded px-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        aria-label={`Urutkan berdasarkan total biaya ${sortConfig?.key === 'totalCost' && sortConfig.direction === 'asc' ? '(naik)' : '(turun)'}`}
                                    >
                                        <span>Total Biaya</span>
                                        {sortConfig?.key === 'totalCost' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownNarrowWide className="h-3.5 w-3.5" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {driverStats.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-14">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                                                <FileSearch className="h-7 w-7 text-gray-300" aria-hidden="true" />
                                            </div>
                                            <p className="text-sm font-semibold text-gray-900">Belum ada statistik untuk periode ini</p>
                                            <p className="text-xs font-normal text-slate-500 mt-1">Coba sesuaikan filter driver atau rentang waktu yang dipilih.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                driverStats.map((stat, index) => (
                                    <tr key={stat.driverId} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-xs font-semibold text-slate-600">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-semibold text-slate-700 uppercase">
                                                        {stat.driverName.substring(0, 2)}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-gray-900 text-sm">{stat.driverName}</p>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-6 text-center">
                                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 tabular-nums">
                                                {stat.totalTrips}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-6 text-right">
                                            <span className="text-sm font-medium text-slate-600 tabular-nums">{formatCurrency(stat.totalToll)}</span>
                                        </td>
                                        <td className="py-3.5 px-6 text-right">
                                            <span className="text-sm font-medium text-slate-600 tabular-nums">{formatCurrency(stat.totalOperational)}</span>
                                        </td>
                                        <td className="py-3.5 px-6 text-right">
                                            <span className="text-sm font-bold text-emerald-700 tabular-nums">{formatCurrency(stat.totalCost)}</span>
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
