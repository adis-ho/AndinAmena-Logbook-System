import { useEffect, useState, useMemo } from 'react';
import { ApiService } from '../../services/api';
import DateRangePicker from '../../components/ui/DateRangePicker';
import type { LogbookEntry, User } from '../../types';
import { BarChart3, TrendingUp, Users, Wallet, BookOpen, ArrowUpNarrowWide, ArrowDownNarrowWide, FileSpreadsheet, FileText } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
// import { id } from 'date-fns/locale'; // Unused
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/calculations';
import { SkeletonLogbookList } from '../../components/ui/Skeleton';
import { cn } from '../../utils/cn';

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
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);

    // Filters
    const [dateStart, setDateStart] = useState<string>(
        format(startOfMonth(new Date()), 'yyyy-MM-dd')
    );
    const [dateEnd, setDateEnd] = useState<string>(
        format(endOfMonth(new Date()), 'yyyy-MM-dd')
    );
    const [filterDriver, setFilterDriver] = useState('');
    const [periodLabel, setPeriodLabel] = useState('Bulan Ini');

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: keyof DriverStats; direction: 'asc' | 'desc' } | null>({ key: 'totalCost', direction: 'desc' });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all drivers and logbooks for the period
                // Note: We need all logbooks to aggregate client-side for now
                // In a real large-scale app, this should be an aggregation endpoint
                const [usersData, logbooksData] = await Promise.all([
                    ApiService.getUsers(),
                    ApiService.getAllLogbooks(dateStart, dateEnd)
                ]);

                setUsers(usersData.filter(u => u.role === 'driver' && u.status === 'active'));
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

        // Initialize with all active drivers
        users.forEach(user => {
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

        // Sum up logbooks
        logbooks.forEach(log => {
            // Skip if driver filtered out
            if (filterDriver && log.driver_id !== filterDriver) return;

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
    }, [users, logbooks, sortConfig, filterDriver]);


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

    const handlePeriodChange = (days: number | 'month' | 'custom') => {
        const today = new Date();
        if (days === 'month') {
            setDateStart(format(startOfMonth(today), 'yyyy-MM-dd'));
            setDateEnd(format(endOfMonth(today), 'yyyy-MM-dd'));
            setPeriodLabel('Bulan Ini');
        } else if (typeof days === 'number') {
            setDateStart(format(subDays(today, days), 'yyyy-MM-dd'));
            setDateEnd(format(today, 'yyyy-MM-dd'));
            setPeriodLabel(`${days} Hari Terakhir`);
        } else {
            setPeriodLabel('Custom Range');
        }
    };

    // Export Logic
    const sanitizeFilename = (str: string) => str.replace(/[^a-zA-Z0-9\-]/g, '-').replace(/-+/g, '-');

    const buildExportFilename = (ext: 'pdf' | 'xlsx') => {
        // Use sanitizeFilename if we ever add dynamic parts like user input. 
        // For now dateStart/End are safe, but good practice to keep the helper.
        return `Ringkasan_Driver_${sanitizeFilename(dateStart)}_${sanitizeFilename(dateEnd)}.${ext}`;
    };

    const exportToExcel = () => {
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

    const exportToPDF = () => {
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

    if (loading && users.length === 0) {
        return <SkeletonLogbookList />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Ringkasan Driver</h1>
                        <p className="text-sm text-gray-500">Statistik performa dan biaya per driver</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
                    >
                        <FileText className="h-4 w-4" />
                        PDF
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    {/* Driver Select Dropdown */}
                    <div className="min-w-[200px]">
                        <select
                            value={filterDriver}
                            onChange={(e) => setFilterDriver(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-colors cursor-pointer"
                        >
                            <option value="">Semua Driver</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

                    <button
                        onClick={() => handlePeriodChange('month')}
                        className={cn("px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                            periodLabel === 'Bulan Ini' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                    >
                        Bulan Ini
                    </button>
                    <button
                        onClick={() => handlePeriodChange(7)}
                        className={cn("px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                            periodLabel === '7 Hari Terakhir' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                    >
                        7 Hari
                    </button>
                    <button
                        onClick={() => handlePeriodChange(30)}
                        className={cn("px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                            periodLabel === '30 Hari Terakhir' ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                    >
                        30 Hari
                    </button>
                </div>

                <div className="w-full md:w-auto">
                    <DateRangePicker
                        startDate={dateStart}
                        endDate={dateEnd}
                        onChange={(start, end) => {
                            setDateStart(start);
                            setDateEnd(end);
                            setPeriodLabel('Custom Range');
                        }}
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Users className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Total Driver</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{overallStats.drivers}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Total Trip</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{overallStats.trips}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Total Biaya</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(overallStats.cost)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Rata-rata / Driver</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(Math.round(overallStats.cost / (overallStats.drivers || 1)))}</p>
                </div>
            </div>

            {/* Summary Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-center w-16 text-sm font-medium text-gray-600">No</th>
                                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600" onClick={() => handleSort('driverName')}>
                                    <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 group">
                                        Nama Driver
                                        {sortConfig?.key === 'driverName' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-center text-sm font-medium text-gray-600" onClick={() => handleSort('totalTrips')}>
                                    <div className="flex items-center justify-center gap-1 cursor-pointer hover:text-blue-600 group">
                                        Total Trip
                                        {sortConfig?.key === 'totalTrips' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-600" onClick={() => handleSort('totalToll')}>
                                    <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-blue-600 group">
                                        Biaya Tol
                                        {sortConfig?.key === 'totalToll' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-600" onClick={() => handleSort('totalOperational')}>
                                    <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-blue-600 group">
                                        Biaya Lain
                                        {sortConfig?.key === 'totalOperational' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 text-right text-sm font-medium text-gray-600" onClick={() => handleSort('totalCost')}>
                                    <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-blue-600 group">
                                        Total Biaya
                                        {sortConfig?.key === 'totalCost' && (
                                            sortConfig.direction === 'asc' ? <ArrowUpNarrowWide className="h-4 w-4" /> : <ArrowDownNarrowWide className="h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {driverStats.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        Tidak ada data untuk periode ini
                                    </td>
                                </tr>
                            ) : (
                                driverStats.map((stat, index) => (
                                    <tr key={stat.driverId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-center text-gray-500">{index + 1}</td>
                                        <td className="py-3 px-4 text-gray-900 font-medium">{stat.driverName}</td>
                                        <td className="py-3 px-4 text-center text-gray-600">
                                            <span className="bg-gray-100 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-700">
                                                {stat.totalTrips}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(stat.totalToll)}</td>
                                        <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(stat.totalOperational)}</td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(stat.totalCost)}</td>
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
