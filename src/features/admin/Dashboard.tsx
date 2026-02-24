import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api';
import { LayoutDashboard, BookOpen, Users, Truck, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Line, Label } from 'recharts';
import { format, differenceInDays, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import Select from '../../components/ui/Select';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';

interface DashboardData {
    totalLogbooks: number;
    todayLogbooks: number;
    weekLogbooks: number;
    monthLogbooks: number;
    totalDrivers: number;
    totalUnits: number;
    totalCost: number;
    todayCost: number;
    periodCost: number;
    statusData: Array<{ name: string; value: number }> | null;
    dailyData: Array<{ date: string; count: number; cost: number }> | null;
    topDrivers: Array<{ name: string; cost: number }> | null;
    recentLogbooks: Array<{
        id: string;
        date: string;
        client_name: string;
        rute: string;
        toll_cost: number;
        operational_cost: number;
        status: string;
        driver_name: string;
    }> | null;
}

const STATUS_COLORS: Record<string, string> = {
    'Disetujui': '#10B981', // Green
    'Pending': '#F59E0B',   // Yellow/Orange
    'Ditolak': '#EF4444',   // Red
};
const DEFAULT_COLOR = '#9CA3AF'; // Gray

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<number>(7);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await ApiService.getAdminDashboardStats(period);

            if (result) {
                setData(result);
            } else {
                setError('Gagal memuat data dashboard. Pastikan RPC function sudah dibuat di Supabase.');
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError('Terjadi kesalahan saat memuat data.');
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Real-time: auto-refresh when logbooks change
    useRealtimeSubscription({
        table: 'logbooks',
        events: ['INSERT', 'UPDATE', 'DELETE'],
        onUpdate: fetchData,
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    if (loading) {
        return <SkeletonDashboard />;
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <h3 className="font-bold text-red-700 mb-2">Error Memuat Dashboard</h3>
                <p className="text-red-600 text-sm mb-4">{error || 'Data tidak tersedia'}</p>
                <p className="text-xs text-gray-500">
                    Pastikan RPC function <code className="bg-red-100 px-1 rounded">get_admin_dashboard_stats</code> sudah dibuat di Supabase SQL Editor.
                </p>
            </div>
        );
    }

    const statusData = data.statusData || [];
    const dailyData = data.dailyData || [];
    const topDrivers = data.topDrivers || [];
    const recentLogbooks = data.recentLogbooks || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
                </div>

                <div className="w-48">
                    <Select
                        value={String(period)}
                        onChange={(val) => setPeriod(Number(val))}
                        options={[
                            { value: "7", label: "7 Hari Terakhir" },
                            { value: "30", label: "30 Hari Terakhir" },
                            { value: "90", label: "3 Bulan Terakhir" },
                            { value: String(differenceInDays(new Date(), startOfMonth(new Date())) + 1), label: "Bulan Ini" }
                        ]}
                    />
                </div>
            </div>

            {/* Unified KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Laporan Stats */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-3 relative">
                        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100/50">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Laporan</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tabular-nums relative">{data.totalLogbooks}</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 relative overflow-hidden group hover:border-emerald-200 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-3 relative">
                        <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100/50">
                            <Calendar className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Laporan Hari Ini</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tabular-nums relative">{data.todayLogbooks}</p>
                </div>

                {/* Resource Stats */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 relative overflow-hidden group hover:border-purple-200 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-3 relative">
                        <div className="bg-purple-50 p-2 rounded-lg border border-purple-100/50">
                            <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Jml Driver</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tabular-nums relative">{data.totalDrivers}</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 relative overflow-hidden group hover:border-amber-200 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-3 mb-3 relative">
                        <div className="bg-amber-50 p-2 rounded-lg border border-amber-100/50">
                            <Truck className="h-4 w-4 text-amber-600" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Unit Aktif</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900 tabular-nums relative">{data.totalUnits}</p>
                </div>

                {/* Cost Summary (Accentuated) */}
                <div className="bg-gradient-to-br from-indigo-500 via-blue-600 to-blue-700 p-5 rounded-xl border border-blue-400/30 relative overflow-hidden group md:col-span-2 lg:col-span-1 shadow-lg shadow-blue-500/10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay"></div>
                    <div className="flex items-center gap-3 mb-3 relative">
                        <div className="bg-white/10 p-2 rounded-lg border border-white/10 backdrop-blur-md">
                            <TrendingUp className="h-4 w-4 text-blue-50" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100/80">Total Biaya (Semua)</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-white tabular-nums relative truncate drop-shadow-sm">{formatCurrency(data.totalCost)}</p>
                </div>

                <div className="bg-gradient-to-br from-teal-500 via-emerald-500 to-emerald-600 p-5 rounded-xl border border-emerald-400/30 relative overflow-hidden group md:col-span-1 lg:col-span-1 shadow-lg shadow-emerald-500/10">
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-10 -mb-10 group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay"></div>
                    <div className="flex items-center gap-3 mb-3 relative">
                        <div className="bg-white/10 p-2 rounded-lg border border-white/10 backdrop-blur-md">
                            <Calendar className="h-4 w-4 text-emerald-50" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/80">Biaya Hari Ini</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-black text-white tabular-nums relative truncate drop-shadow-sm">{formatCurrency(data.todayCost)}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Combo Chart: Laporan Harian & Trend Biaya */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col col-span-1 lg:col-span-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-6 gap-4">
                        <div>
                            <h3 className="font-bold text-gray-900">Statistik {period} Hari Terakhir</h3>
                            <p className="text-sm text-gray-500 mt-1">Pergerakan jumlah laporan & estimasi biaya operasional</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-50/50 border border-blue-100/50 px-4 py-2 rounded-lg text-center backdrop-blur-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-0.5">Total Laporan</p>
                                <p className="text-xl font-extrabold text-blue-900 tabular-nums leading-none">
                                    {dailyData.reduce((acc, curr) => acc + curr.count, 0)}
                                </p>
                            </div>
                            <div className="bg-green-50/50 border border-green-100/50 px-4 py-2 rounded-lg text-center backdrop-blur-sm">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-0.5">Total Biaya</p>
                                <p className="text-xl font-extrabold text-green-900 tabular-nums leading-none">
                                    {formatCurrency(dailyData.reduce((acc, curr) => acc + curr.cost, 0))}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="colorCostLine" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#10B981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10B981" floodOpacity="0.3" />
                                    </filter>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    yAxisId="left"
                                    orientation="left"
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                    dx={-10}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${(v / 1000)}k`}
                                    dx={10}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc', radius: 6 }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const countData = payload.find(p => p.dataKey === 'count');
                                            const costData = payload.find(p => p.dataKey === 'cost');
                                            return (
                                                <div className="bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl p-4 min-w-[200px]">
                                                    <p className="text-xs font-semibold text-gray-500 mb-3 border-b border-gray-100 pb-2">{label}</p>
                                                    <div className="space-y-2">
                                                        {countData && (
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                                                                    <span className="text-sm font-medium text-gray-600">Laporan</span>
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-900">{countData.value}</span>
                                                            </div>
                                                        )}
                                                        {costData && (
                                                            <div className="flex items-center justify-between gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                                                                    <span className="text-sm font-medium text-gray-600">Biaya</span>
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-900">{formatCurrency(costData.value as number)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    yAxisId="left"
                                    dataKey="count"
                                    fill="url(#colorCount)"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={48}
                                />
                                {/* Overlay LineChart on BarChart requires re-importing Line & importing ComposedChart if we strictly want it, but Recharts BarChart accepts Line component directly! We just need to add it. */}
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="cost"
                                    stroke="url(#colorCostLine)"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#fff', stroke: '#10B981', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                                    style={{ filter: 'url(#shadow)' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Pie Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900">Status Laporan</h3>
                            <p className="text-sm text-gray-500 mt-1">Distribusi berdasarkan persetujuan</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            {statusData.map((item) => (
                                <div key={item.name} className="flex items-center gap-2 bg-gray-50/80 px-2.5 py-1 rounded-md border border-gray-100/50">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] || DEFAULT_COLOR }}></div>
                                    <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{item.name} ({item.value})</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center min-h-[250px] mt-2">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <Pie
                                    data={statusData.filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={10}
                                >
                                    {statusData.filter(d => d.value > 0).map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={STATUS_COLORS[entry.name] || DEFAULT_COLOR}
                                            opacity={0.9} // Slight transparency for premium feel
                                            style={{ filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.05))' }} // Soft shadow on slices
                                        />
                                    ))}
                                    <Label
                                        value={statusData.reduce((acc, curr) => acc + curr.value, 0)}
                                        position="centerBottom"
                                        className="text-[40px] font-black fill-gray-900 tabular-nums"
                                        dy={-2}
                                    />
                                    <Label
                                        value="TOTAL LAPORAN"
                                        position="centerTop"
                                        className="text-[10px] font-bold uppercase tracking-widest fill-gray-400"
                                        dy={22}
                                    />
                                </Pie>
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl p-3 min-w-[140px]">
                                                    <p className="text-xs font-semibold text-gray-500 mb-2 border-b border-gray-100 pb-2 uppercase tracking-wide">{data.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: STATUS_COLORS[data.name] || DEFAULT_COLOR }} />
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {data.value} <span className="text-gray-500 font-medium text-xs">Laporan</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Drivers Horizontal Bar */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-gray-900">Top 5 Driver</h3>
                            <p className="text-sm text-gray-500 mt-1">Berdasarkan total biaya operasional terbesar</p>
                        </div>
                        <div className="bg-purple-50/50 border border-purple-100/50 px-3 py-1.5 rounded-lg text-right backdrop-blur-sm">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-0.5">Total Top 5</p>
                            <p className="text-sm font-extrabold text-purple-900 tabular-nums leading-none">
                                {formatCurrency(topDrivers.reduce((acc, curr) => acc + curr.cost, 0))}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[250px] mt-2">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={topDrivers} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDriver" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.6} />
                                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.9} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f1f5f9" />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                                    tickFormatter={(v) => `${(v / 1000)}k`}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={0}
                                    dy={10}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                    width={90}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc', radius: 4 }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl p-3 min-w-[140px]">
                                                    <p className="text-xs font-semibold text-gray-500 mb-2 border-b border-gray-100 pb-2 truncate">{label}</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full shadow-sm bg-purple-500" />
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {formatCurrency(payload[0].value as number)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="cost"
                                    fill="url(#colorDriver)"
                                    radius={[0, 6, 6, 0]}
                                    maxBarSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Logbooks */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900">Laporan Terbaru</h3>
                    <button onClick={() => navigate('/admin/logbooks')} className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Lihat Semua</button>
                </div>

                <div className="space-y-1">
                    {recentLogbooks.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
                                <BookOpen className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">Belum ada laporan terbaru</p>
                        </div>
                    ) : (
                        recentLogbooks.map((log, index) => (
                            <div
                                key={log.id}
                                className={`flex items-center justify-between py-4 group hover:bg-slate-50/50 transition-colors px-2 -mx-2 rounded-lg ${index !== recentLogbooks.length - 1 ? 'border-b border-gray-100/50' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-white shadow-sm ring-1 ring-slate-900/5 shrink-0">
                                        <span className="text-xs font-bold text-slate-600 uppercase">
                                            {log.driver_name.substring(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm mb-0.5 group-hover:text-blue-600 transition-colors">
                                            {log.client_name} <span className="text-gray-400 font-normal mx-1">&middot;</span> {log.rute}
                                        </p>
                                        <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400 tracking-wide">
                                            <span className="text-gray-500">{log.driver_name}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{format(new Date(log.date), 'dd MMM yyyy', { locale: id })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${log.status === 'approved'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' :
                                        log.status === 'rejected'
                                            ? 'bg-rose-50 text-rose-600 border-rose-200/60' :
                                            'bg-amber-50 text-amber-600 border-amber-200/60'
                                        }`}>
                                        {log.status === 'approved' ? 'Disetujui' : log.status === 'rejected' ? 'Ditolak' : 'Pending'}
                                    </span>
                                    <p className="text-sm font-bold text-gray-900 tabular-nums">
                                        {formatCurrency(log.toll_cost + log.operational_cost)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
