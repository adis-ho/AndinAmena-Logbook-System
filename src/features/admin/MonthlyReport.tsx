import { useState, useEffect } from 'react';
import { FileText, Loader2, Filter } from 'lucide-react';
import Select from '../../components/ui/Select';
import { ApiService } from '../../services/api';
import { generateMonthlyReportPDF } from '../../utils/reportPdfGenerator';
import { useToast } from '../../context/ToastContext';

// Component constants
const MONTHS = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
];

export default function MonthlyReport() {
    // Toast hook
    const { showToast } = useToast();
    const toast = {
        success: (msg: string) => showToast('success', msg),
        error: (msg: string) => showToast('error', msg),
        info: (msg: string) => showToast('info', msg),
        warning: (msg: string) => showToast('warning', msg)
    };

    // State for filters
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
    const [selectedYear, setSelectedYear] = useState(currentYear.toString());
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');

    // State for lists
    const [drivers, setDrivers] = useState<Array<{ value: string, label: string }>>([]);
    const [units, setUnits] = useState<Array<{ value: string, label: string }>>([]);

    // State for report data
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false); // For initial data fetch

    // Years option (last 5 years)
    const years = Array.from({ length: 5 }, (_, i) => {
        const y = currentYear - i;
        return { value: y.toString(), label: y.toString() };
    });

    // Fetch drivers and units on mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [users, unitsData] = await Promise.all([
                    ApiService.getUsers(),
                    ApiService.getUnits()
                ]);

                // Filter only drivers for the dropdown? Or all users?
                // Usually report is for driving activities, mostly drivers. 
                // But admin can also drive. Let's show all for flexibility or filter by role 'driver'.
                // Given the context used in other lists, we usually map all users.
                setDrivers(users.map(u => ({ value: u.id, label: u.full_name })));

                setUnits(unitsData.map(u => ({ value: u.id, label: `${u.name} - ${u.plate_number}` })));
            } catch (error) {
                console.error('Error fetching filters:', error);
                toast.error('Gagal memuat data filter');
            }
        };
        fetchFilters();
    }, []);

    const handleGeneratePreview = async () => {
        setIsGenerating(true);
        setReportData(null);
        try {
            const data = await ApiService.getMonthlyReportData(
                parseInt(selectedMonth),
                parseInt(selectedYear),
                selectedDriver || undefined,
                selectedUnit || undefined
            );

            if (!data) {
                toast.error('Gagal mengambil data laporan');
                return;
            }

            if (data.summary.total_trips === 0) {
                toast.info('Tidak ada data logbook untuk periode ini');
            }

            setReportData(data);
        } catch (error) {
            console.error('Preview error:', error);
            toast.error('Terjadi kesalahan saat memproses laporan');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!reportData) return;

        setIsLoading(true);
        try {
            const monthName = MONTHS.find(m => m.value === selectedMonth)?.label || '';
            generateMonthlyReportPDF(reportData, monthName, parseInt(selectedYear));
            toast.success('Laporan berhasil didownload');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Gagal membuat PDF');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Laporan Bulanan</h1>
                    <p className="text-gray-500">Rekapitulasi operasional dan biaya kendaraan</p>
                </div>
            </div>

            {/* Filters Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4 text-gray-800 font-medium">
                    <Filter className="w-4 h-4" />
                    Filter Laporan
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Bulan</label>
                        <Select
                            value={selectedMonth}
                            onChange={setSelectedMonth}
                            options={MONTHS}
                            placeholder="Pilih Bulan"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tahun</label>
                        <Select
                            value={selectedYear}
                            onChange={setSelectedYear}
                            options={years}
                            placeholder="Pilih Tahun"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Driver (Opsional)</label>
                        <Select
                            value={selectedDriver}
                            onChange={setSelectedDriver}
                            options={[{ value: '', label: 'Semua Driver' }, ...drivers]}
                            placeholder="Semua Driver"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Unit (Opsional)</label>
                        <Select
                            value={selectedUnit}
                            onChange={setSelectedUnit}
                            options={[{ value: '', label: 'Semua Unit' }, ...units]}
                            placeholder="Semua Unit"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleGeneratePreview}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Tampilkan Laporan
                    </button>
                </div>
            </div>

            {/* Preview Section */}
            {reportData && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Action Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                            Download PDF
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500 mb-1">Total Perjalanan</p>
                            <p className="text-3xl font-bold text-gray-900">{reportData.summary.total_trips}</p>
                            <p className="text-xs text-gray-400 mt-2">Dalam periode terpilih</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500 mb-1">Total Biaya (Tol + Lain)</p>
                            <p className="text-3xl font-bold text-blue-600">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(reportData.summary.total_cost)}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">Tidak termasuk BBM</p>
                        </div>
                    </div>

                    {/* Tables Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Driver Stats */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Ringkasan Per Driver</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">Driver</th>
                                            <th className="px-4 py-3 text-center">Trip</th>
                                            <th className="px-4 py-3 text-right">Biaya</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.driver_stats.slice(0, 10).map((d: any) => (
                                            <tr key={d.driver_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                                                <td className="px-4 py-3 text-center">{d.trips}</td>
                                                <td className="px-4 py-3 text-right text-gray-600">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(d.total_cost)}
                                                </td>
                                            </tr>
                                        ))}
                                        {reportData.driver_stats.length > 10 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-center text-gray-500 text-xs italic">
                                                    ...dan {reportData.driver_stats.length - 10} driver lainnya (lihat di PDF)
                                                </td>
                                            </tr>
                                        )}
                                        {reportData.driver_stats.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                                                    Tidak ada data
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Unit Stats */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Ringkasan Per Unit</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">Unit / Plat</th>
                                            <th className="px-4 py-3 text-center">Trip</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.unit_stats.slice(0, 10).map((u: any) => (
                                            <tr key={u.unit_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">{u.name}</div>
                                                    <div className="text-xs text-gray-500">{u.plate_number}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center">{u.trips}</td>
                                            </tr>
                                        ))}
                                        {reportData.unit_stats.length > 10 && (
                                            <tr>
                                                <td colSpan={2} className="px-4 py-3 text-center text-gray-500 text-xs italic">
                                                    ...dan {reportData.unit_stats.length - 10} unit lainnya (lihat di PDF)
                                                </td>
                                            </tr>
                                        )}
                                        {reportData.unit_stats.length === 0 && (
                                            <tr>
                                                <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                                                    Tidak ada data
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
