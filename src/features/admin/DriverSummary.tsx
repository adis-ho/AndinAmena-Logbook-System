import { useEffect, useState, useMemo } from 'react';
import { ApiService } from '../../services/api';
import DateRangePicker from '../../components/ui/DateRangePicker';
import type { LogbookEntry } from '../../types';
import { BarChart3, TrendingUp, Users, Wallet, BookOpen, ArrowUpNarrowWide, ArrowDownNarrowWide, FileSpreadsheet, FileText, FileSearch } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
// import { id } from 'date-fns/locale'; // Unused
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/calculations';
import { SkeletonLogbookList } from '../../components/ui/Skeleton';

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
        return <SkeletonLogbookList />;
    }

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />
                <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center shadow-sm">
                        <BarChart3 className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Ringkasan Driver</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Statistik performa dan biaya per driver</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative">
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 group/btn px-4 py-2 bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/50 hover:border-rose-300 text-rose-700 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        aria-label="Cetak ke format PDF"
                    >
                        <FileText className="h-4 w-4 text-rose-500 group-hover/btn:scale-110 transition-transform" aria-hidden="true" />
                        Export PDF
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 group/btn px-4 py-2 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 hover:border-emerald-300 text-emerald-700 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        aria-label="Cetak ke format Excel"
                    >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-500 group-hover/btn:scale-110 transition-transform" aria-hidden="true" />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-5 items-start xl:items-center justify-between transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full xl:w-auto">
                    {/* Driver Filter */}
                    <div className="w-full sm:w-[240px] z-20 space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Filter Driver</label>
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
                    <div className="w-full sm:w-[280px] z-10 space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Filter Kendaraan</label>
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
                </div>

                <div className="w-full xl:w-auto space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Rentang Waktu</label>
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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
                    <div className="flex items-center gap-3 mb-4 relative">
                        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100/50 shadow-sm text-blue-600">
                            <Users className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-tight">Total<br />Driver</p>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tabular-nums relative">{overallStats.drivers}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 relative overflow-hidden group hover:border-violet-200 transition-colors shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
                    <div className="flex items-center gap-3 mb-4 relative">
                        <div className="bg-violet-50 p-2.5 rounded-xl border border-violet-100/50 shadow-sm text-violet-600">
                            <BookOpen className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-tight">Total<br />Trip Selesai</p>
                    </div>
                    <p className="text-3xl font-black text-gray-900 tabular-nums relative">{overallStats.trips}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50/50 to-white p-5 rounded-2xl border border-emerald-100/60 relative overflow-hidden group hover:border-emerald-300 transition-colors shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/50 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500" />
                    <div className="flex items-center gap-3 mb-4 relative">
                        <div className="bg-emerald-100/80 p-2.5 rounded-xl border border-emerald-200/50 shadow-sm text-emerald-600">
                            <Wallet className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80 leading-tight">Total Biaya<br />Operasional</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-950 tabular-nums relative truncate">{formatCurrency(overallStats.cost)}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 relative overflow-hidden group hover:border-amber-200 transition-colors shadow-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
                    <div className="flex items-center gap-3 mb-4 relative">
                        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100/50 shadow-sm text-amber-600">
                            <TrendingUp className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-tight">Rata-rata<br />Per Driver</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tabular-nums relative truncate">{formatCurrency(Math.round(overallStats.cost / (overallStats.drivers || 1)))}</p>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {driverStats.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-12 px-6 text-center">
                        <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <FileSearch className="h-8 w-8 text-gray-300" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-bold text-gray-900">Belum ada statistik driver</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">Coba sesuaikan filter atau rentang waktu.</p>
                    </div>
                ) : (
                    driverStats.map((stat, index) => (
                        <div key={stat.driverId} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-100 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-white flex items-center justify-center shadow-sm shrink-0 ring-1 ring-slate-900/5 relative">
                                        <span className="text-xs font-bold text-slate-600 uppercase">
                                            {stat.driverName.substring(0, 2)}
                                        </span>
                                        <div className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white">
                                            #{index + 1}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{stat.driverName}</h3>
                                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">ID: {stat.driverId.substring(0, 8)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Trip</p>
                                    <span className="inline-flex bg-violet-50 text-violet-700 text-xs font-black px-2.5 py-1 rounded-lg border border-violet-100/50 tabular-nums">
                                        {stat.totalTrips}x
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-slate-50/50 p-3 rounded-xl border border-gray-100/50 transition-colors group-hover:bg-slate-50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tol / Parkir</p>
                                    <p className="font-bold text-gray-700 tabular-nums text-sm truncate">{formatCurrency(stat.totalToll)}</p>
                                </div>
                                <div className="bg-slate-50/50 p-3 rounded-xl border border-gray-100/50 transition-colors group-hover:bg-slate-50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Biaya Lain</p>
                                    <p className="font-bold text-gray-700 tabular-nums text-sm truncate">{formatCurrency(stat.totalOperational)}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Total Pengeluaran</p>
                                <p className="font-black text-lg text-emerald-600 tabular-nums tracking-tight">{formatCurrency(stat.totalCost)}</p>
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
                                <th className="py-4 px-6 text-center w-16 text-[10px] uppercase tracking-widest font-bold text-gray-400">Rnk</th>
                                <th className="py-4 px-6 text-left">
                                    <button
                                        onClick={() => handleSort('driverName')}
                                        className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 -mx-1"
                                        aria-label={`Urutkan berdasarkan nama driver ${sortConfig?.key === 'driverName' && sortConfig.direction === 'asc' ? '(naik)' : '(turun)'}`}
                                    >
                                        IDENTITAS DRIVER
                                        {sortConfig?.key === 'driverName' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownNarrowWide className="h-3.5 w-3.5" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th className="py-4 px-6 text-center">
                                    <button
                                        onClick={() => handleSort('totalTrips')}
                                        className="flex items-center justify-center gap-1.5 w-full text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 -mx-1"
                                        aria-label={`Urutkan berdasarkan jumlah trip ${sortConfig?.key === 'totalTrips' && sortConfig.direction === 'asc' ? '(naik)' : '(turun)'}`}
                                    >
                                        TRIP SELESAI
                                        {sortConfig?.key === 'totalTrips' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownNarrowWide className="h-3.5 w-3.5" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th className="py-4 px-6 text-right">
                                    <button
                                        onClick={() => handleSort('totalToll')}
                                        className="flex items-center justify-end gap-1.5 w-full text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 -mx-1"
                                        aria-label={`Urutkan berdasarkan biaya tol ${sortConfig?.key === 'totalToll' && sortConfig.direction === 'asc' ? '(naik)' : '(turun)'}`}
                                    >
                                        TOL & RETRIBUSI
                                        {sortConfig?.key === 'totalToll' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownNarrowWide className="h-3.5 w-3.5" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th className="py-4 px-6 text-right">
                                    <button
                                        onClick={() => handleSort('totalOperational')}
                                        className="flex items-center justify-end gap-1.5 w-full text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 -mx-1"
                                        aria-label={`Urutkan berdasarkan biaya lain ${sortConfig?.key === 'totalOperational' && sortConfig.direction === 'asc' ? '(naik)' : '(turun)'}`}
                                    >
                                        BIAYA LAIN
                                        {sortConfig?.key === 'totalOperational' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownNarrowWide className="h-3.5 w-3.5" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th className="py-4 px-6 text-right">
                                    <button
                                        onClick={() => handleSort('totalCost')}
                                        className="flex items-center justify-end gap-1.5 w-full text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-emerald-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1 -mx-1"
                                        aria-label={`Urutkan berdasarkan total biaya ${sortConfig?.key === 'totalCost' && sortConfig.direction === 'asc' ? '(naik)' : '(turun)'}`}
                                    >
                                        TOTAL PENGELUARAN
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
                                    <td colSpan={6} className="py-16">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-4 shadow-sm">
                                                <FileSearch className="h-8 w-8 text-gray-300" aria-hidden="true" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">Belum ada statistik untuk periode ini</p>
                                            <p className="text-xs font-medium text-gray-500 mt-1">Coba sesuaikan filter driver atau rentang waktu yang dipilih.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                driverStats.map((stat, index) => (
                                    <tr key={stat.driverId} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                        <td className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-[10px] font-black text-slate-500 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm transition-all">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase">
                                                        {stat.driverName.substring(0, 2)}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{stat.driverName}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="inline-flex bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm text-xs font-bold text-gray-700 tabular-nums">
                                                {stat.totalTrips}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-[13px] font-semibold text-gray-600 tabular-nums">{formatCurrency(stat.totalToll)}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-[13px] font-semibold text-gray-600 tabular-nums">{formatCurrency(stat.totalOperational)}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="text-[13px] font-black text-emerald-600 tabular-nums group-hover:text-emerald-700 transition-colors">{formatCurrency(stat.totalCost)}</span>
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
