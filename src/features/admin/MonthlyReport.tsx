import { useMemo, useState } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import Select from '../../components/ui/Select';
import { ApiService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useUnitsQuery, useUsersQuery } from '../../hooks/useReferenceDataQueries';
import { SkeletonMonthlyReport } from '../../components/ui/Skeleton';

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

    const { data: usersData = [], isLoading: usersLoading } = useUsersQuery();
    const { data: unitsData = [], isLoading: unitsLoading } = useUnitsQuery();
    const drivers = useMemo(() => usersData.map(u => ({ value: u.id, label: u.full_name })), [usersData]);
    const units = useMemo(() => unitsData.map(u => ({ value: u.id, label: `${u.name} (${u.plate_number})` })), [unitsData]);

    // State for report data
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false); // For data fetch

    // Years option (last 5 years)
    const years = Array.from({ length: 5 }, (_, i) => {
        const y = currentYear - i;
        return { value: y.toString(), label: y.toString() };
    });

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
            import('../../utils/reportPdfGenerator').then(({ generateMonthlyReportPDF }) => {
                generateMonthlyReportPDF(reportData, monthName, parseInt(selectedYear));
                toast.success('Laporan berhasil didownload');
            }).catch((error) => {
                console.error('PDF Generation Error:', error);
                toast.error('Gagal membuat PDF');
            }).finally(() => {
                setIsLoading(false);
            });
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Gagal membuat PDF');
            setIsLoading(false);
        }
    };

    if (usersLoading || unitsLoading) {
        return <SkeletonMonthlyReport />;
    }

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Laporan Bulanan</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">Rekapitulasi operasional dan biaya kendaraan</p>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600">Periode Bulan</label>
                        <Select
                            value={selectedMonth}
                            onChange={setSelectedMonth}
                            options={MONTHS}
                            placeholder="Pilih Bulan"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600">Tahun</label>
                        <Select
                            value={selectedYear}
                            onChange={setSelectedYear}
                            options={years}
                            placeholder="Pilih Tahun"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600">Filter Driver (Opsional)</label>
                        <Select
                            value={selectedDriver}
                            onChange={setSelectedDriver}
                            options={[{ value: '', label: 'Semua Driver' }, ...drivers]}
                            placeholder="Semua Driver"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600">Filter Unit (Opsional)</label>
                        <Select
                            value={selectedUnit}
                            onChange={setSelectedUnit}
                            options={[{ value: '', label: 'Semua Unit' }, ...units]}
                            placeholder="Semua Unit"
                        />
                    </div>
                </div>

                <div className="pt-2 flex justify-end">
                    <button
                        onClick={handleGeneratePreview}
                        disabled={isGenerating}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-medium text-sm shadow-sm transition-all touch-manipulation select-none disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                        {isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <FileText className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>{isGenerating ? 'Memproses Data...' : 'Tampilkan Laporan'}</span>
                    </button>
                </div>
            </div>

            {/* In-place Generating Skeleton */}
            {isGenerating && (
                <div className="space-y-6 pt-2" aria-busy="true" aria-label="Memproses pratinjau laporan">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse space-y-3">
                            <div className="h-3.5 w-28 bg-gray-200 rounded" />
                            <div className="h-10 w-24 bg-gray-200 rounded-lg" />
                            <div className="h-3 w-48 bg-gray-200 rounded" />
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse space-y-3">
                            <div className="h-3.5 w-36 bg-gray-200 rounded" />
                            <div className="h-10 w-44 bg-gray-200 rounded-lg" />
                            <div className="h-6 w-32 bg-gray-200 rounded-full" />
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Section */}
            {reportData && !isGenerating && (
                <div className="space-y-6 animate-in fade-in duration-200 ease-out">
                    {/* Action Bar */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isLoading}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-[0.98] border border-rose-200 rounded-xl font-medium text-xs uppercase tracking-wider transition-all shadow-sm touch-manipulation select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <FileText className="w-4 h-4" aria-hidden="true" />
                            )}
                            Unduh Dokumen PDF
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Total Perjalanan</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums tracking-tight">{reportData.summary.total_trips}</span>
                                    <span className="text-sm font-medium text-slate-500">trip tercatat</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-4 leading-relaxed">Akumulasi perjalanan dalam kriteria periode dan filter terpilih.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Total Biaya Operasional</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-semibold text-slate-400">Rp</span>
                                    <span className="text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums tracking-tight">
                                        {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(reportData.summary.total_cost)}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200/80 w-fit">
                                <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                                <span>Tidak termasuk biaya BBM</span>
                            </div>
                        </div>
                    </div>

                    {/* Dual Stats: Driver & Unit */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Driver Stats */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Kinerja Per Driver</h3>
                                <span className="inline-flex px-2.5 py-0.5 bg-white rounded-md border border-gray-200 text-xs font-medium text-slate-600 tabular-nums">
                                    10 Teratas
                                </span>
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto flex-1">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th scope="col" className="text-left py-4 px-6 text-xs uppercase tracking-wider font-bold text-gray-600 border-none">Nama Driver</th>
                                            <th scope="col" className="text-center py-4 px-4 text-xs uppercase tracking-wider font-bold text-gray-600 border-none w-24">Trip</th>
                                            <th scope="col" className="text-right py-4 px-6 text-xs uppercase tracking-wider font-bold text-gray-600 border-none w-36">Biaya</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {reportData.driver_stats.slice(0, 10).map((d: any) => (
                                            <tr key={d.driver_id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                                                            <span className="text-xs font-semibold text-slate-700 uppercase">
                                                                {d.name.substring(0, 2)}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-900">{d.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-slate-100 text-xs font-semibold tabular-nums text-slate-700">
                                                        {d.trips}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-6 text-right text-sm font-semibold text-slate-700 tabular-nums">
                                                    {new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(d.total_cost)}
                                                </td>
                                            </tr>
                                        ))}
                                        {reportData.driver_stats.length > 10 && (
                                            <tr>
                                                <td colSpan={3} className="py-4 text-center">
                                                    <span className="text-xs font-medium text-slate-500">
                                                        +{reportData.driver_stats.length - 10} Driver lainnya tersedia di dokumen PDF
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                        {reportData.driver_stats.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-12 text-center">
                                                    <p className="text-xs font-medium text-slate-400">Tidak ada data driver untuk kriteria ini</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card Stack */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {reportData.driver_stats.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-xs font-medium text-slate-400">Tidak ada data driver untuk kriteria ini</p>
                                    </div>
                                ) : (
                                    reportData.driver_stats.slice(0, 10).map((d: any, idx: number) => (
                                        <div key={d.driver_id} className="p-4 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-semibold text-slate-700 uppercase">
                                                        {d.name.substring(0, 2)}
                                                    </span>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold text-slate-400">#{idx + 1}</span>
                                                        <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-500">
                                                        Biaya: <span className="font-semibold text-slate-700 tabular-nums">Rp {new Intl.NumberFormat('id-ID').format(d.total_cost)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center justify-center min-w-[36px] h-8 px-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold tabular-nums">
                                                {d.trips} trip
                                            </span>
                                        </div>
                                    ))
                                )}
                                {reportData.driver_stats.length > 10 && (
                                    <div className="p-3 text-center bg-gray-50/50">
                                        <span className="text-xs font-medium text-slate-500">
                                            +{reportData.driver_stats.length - 10} Driver di PDF
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Unit Stats */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Utilisasi Armada</h3>
                                <span className="inline-flex px-2.5 py-0.5 bg-white rounded-md border border-gray-200 text-xs font-medium text-slate-600 tabular-nums">
                                    10 Teratas
                                </span>
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto flex-1">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th scope="col" className="text-left py-4 px-6 text-xs uppercase tracking-wider font-bold text-gray-600 border-none">Identitas Kendaraan</th>
                                            <th scope="col" className="text-center py-4 px-6 text-xs uppercase tracking-wider font-bold text-gray-600 border-none w-28">Trip</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {reportData.unit_stats.slice(0, 10).map((u: any) => (
                                            <tr key={u.unit_id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3.5 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 font-semibold text-xs text-slate-700 uppercase">
                                                            {u.name.substring(0, 2)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-gray-900 uppercase">{u.name}</span>
                                                            <span className="text-xs font-normal text-slate-500 uppercase tracking-wider mt-0.5">{u.plate_number}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-6 text-center">
                                                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md bg-slate-100 text-xs font-semibold tabular-nums text-slate-700">
                                                        {u.trips}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {reportData.unit_stats.length > 10 && (
                                            <tr>
                                                <td colSpan={2} className="py-4 text-center">
                                                    <span className="text-xs font-medium text-slate-500">
                                                        +{reportData.unit_stats.length - 10} Unit lainnya tersedia di dokumen PDF
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                        {reportData.unit_stats.length === 0 && (
                                            <tr>
                                                <td colSpan={2} className="py-12 text-center">
                                                    <p className="text-xs font-medium text-slate-400">Tidak ada data unit untuk kriteria ini</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card Stack */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {reportData.unit_stats.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-xs font-medium text-slate-400">Tidak ada data unit untuk kriteria ini</p>
                                    </div>
                                ) : (
                                    reportData.unit_stats.slice(0, 10).map((u: any, idx: number) => (
                                        <div key={u.unit_id} className="p-4 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 font-semibold text-xs text-slate-700 uppercase">
                                                    {u.name.substring(0, 2)}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold text-slate-400">#{idx + 1}</span>
                                                        <p className="text-sm font-semibold text-gray-900 uppercase">{u.name}</p>
                                                    </div>
                                                    <p className="text-xs font-normal text-slate-500 uppercase tracking-wider">{u.plate_number}</p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center justify-center min-w-[36px] h-8 px-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold tabular-nums">
                                                {u.trips} trip
                                            </span>
                                        </div>
                                    ))
                                )}
                                {reportData.unit_stats.length > 10 && (
                                    <div className="p-3 text-center bg-gray-50/50">
                                        <span className="text-xs font-medium text-slate-500">
                                            +{reportData.unit_stats.length - 10} Unit di PDF
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
