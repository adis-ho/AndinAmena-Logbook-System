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
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-bl-full -mr-20 -mt-20 pointer-events-none" />
                <div className="flex items-center gap-5 relative">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center shadow-inner relative overflow-hidden group-hover:shadow-md transition-shadow duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <FileText className="h-7 w-7 text-indigo-600 relative z-10" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Laporan Bulanan</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Rekapitulasi operasional dan biaya kendaraan</p>
                    </div>
                </div>
            </div>

            {/* Filters Command Center */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-sm border border-gray-100/60 p-6 md:p-8 relative z-20 ring-1 ring-inset ring-indigo-50/50">
                {/* Refined Decorative Top Glow instead of hard line */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-100/30 to-transparent pointer-events-none opacity-50 rounded-t-[2rem]" />
                <div className="absolute top-0 inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent pointer-events-none" />

                <div className="flex items-center gap-2 mb-6 text-gray-800">
                    <Filter className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-indigo-900/70">Pusat Kendali Laporan</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Periode Bulan</label>
                        <Select
                            value={selectedMonth}
                            onChange={setSelectedMonth}
                            options={MONTHS}
                            placeholder="Pilih Bulan"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Tahun</label>
                        <Select
                            value={selectedYear}
                            onChange={setSelectedYear}
                            options={years}
                            placeholder="Pilih Tahun"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Filter Driver (Opsional)</label>
                        <Select
                            value={selectedDriver}
                            onChange={setSelectedDriver}
                            options={[{ value: '', label: 'Semua Driver' }, ...drivers]}
                            placeholder="Semua Driver"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Filter Unit (Opsional)</label>
                        <Select
                            value={selectedUnit}
                            onChange={setSelectedUnit}
                            options={[{ value: '', label: 'Semua Unit' }, ...units]}
                            placeholder="Semua Unit"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleGeneratePreview}
                        disabled={isGenerating}
                        className="group relative inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-500/20 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 active:translate-y-0 disabled:opacity-80 disabled:hover:-translate-y-0 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <FileText className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>{isGenerating ? 'Memproses Data...' : 'Tampilkan Laporan'}</span>
                        {!isGenerating && <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20 pointer-events-none" />}
                    </button>
                </div>
            </div>

            {/* Preview Section */}
            {reportData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">

                    {/* Action Bar */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-rose-600 bg-rose-50/50 hover:bg-rose-50 rounded-xl ring-1 ring-inset ring-rose-200/60 hover:ring-rose-300 transition-all duration-300 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <FileText className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
                            )}
                            Unduh Dokumen PDF
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
                                <FileText className="w-32 h-32" aria-hidden="true" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Total Perjalanan</p>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-5xl font-black text-gray-900 tabular-nums tracking-tighter">{reportData.summary.total_trips}</span>
                                    <span className="text-sm font-bold text-gray-400">trip</span>
                                </div>
                                <p className="text-xs font-medium text-gray-400 mt-4 leading-relaxed max-w-[200px]">Akumulasi perjalanan dalam kriteria periode dan filter terpilih.</p>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100" />
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/70 mb-4">Total Biaya Operasional</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-gray-400">Rp</span>
                                    <span className="text-5xl font-black text-blue-600 tabular-nums tracking-tighter">
                                        {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(reportData.summary.total_cost)}
                                    </span>
                                </div>
                                <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-widest border border-amber-200/60 w-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Tidak Termasuk BBM
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tables Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Driver Stats */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="px-8 py-6 border-b border-gray-50/80 bg-gradient-to-r from-gray-50/30 to-white flex justify-between items-center">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kinerja Per Driver</h3>
                                <div className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-500 tabular-nums">10 Teratas</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto flex-1 p-2">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Nama Driver</th>
                                            <th className="text-center py-4 px-4 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none w-20">Trip</th>
                                            <th className="text-right py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none w-32">Biaya (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {reportData.driver_stats.slice(0, 10).map((d: any) => (
                                            <tr key={d.driver_id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                                <td className="py-4 px-6 border-none">
                                                    <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{d.name}</span>
                                                </td>
                                                <td className="py-4 px-4 text-center border-none">
                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 group-hover:bg-white border border-gray-100 text-xs font-black tabular-nums text-gray-700 shadow-sm transition-colors">
                                                        {d.trips}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right border-none text-[13px] font-bold text-gray-600 tabular-nums tracking-tight">
                                                    {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(d.total_cost)}
                                                </td>
                                            </tr>
                                        ))}
                                        {reportData.driver_stats.length > 10 && (
                                            <tr>
                                                <td colSpan={3} className="py-5 text-center border-none">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-100">
                                                        +{reportData.driver_stats.length - 10} Driver di PDF
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                        {reportData.driver_stats.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-16 text-center border-none">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nihil Data</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Unit Stats */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="px-8 py-6 border-b border-gray-50/80 bg-gradient-to-r from-gray-50/30 to-white flex justify-between items-center">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilisasi Armada</h3>
                                <div className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-500 tabular-nums">10 Teratas</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto flex-1 p-2">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none">Identitas Kendaraan</th>
                                            <th className="text-center py-4 px-6 text-[10px] uppercase tracking-widest font-black text-gray-400 border-none w-24">Trip</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {reportData.unit_stats.slice(0, 10).map((u: any) => (
                                            <tr key={u.unit_id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                                <td className="py-4 px-6 border-none">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase">{u.name}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{u.plate_number}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center border-none">
                                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 group-hover:bg-white border border-gray-100 text-xs font-black tabular-nums text-gray-700 shadow-sm transition-colors">
                                                        {u.trips}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {reportData.unit_stats.length > 10 && (
                                            <tr>
                                                <td colSpan={2} className="py-5 text-center border-none">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-100">
                                                        +{reportData.unit_stats.length - 10} Unit di PDF
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                        {reportData.unit_stats.length === 0 && (
                                            <tr>
                                                <td colSpan={2} className="py-16 text-center border-none">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nihil Data</p>
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
