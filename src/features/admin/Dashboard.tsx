import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { LayoutDashboard, BookOpen, Users, Truck, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, differenceInDays, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { SkeletonDashboard } from '../../components/ui/Skeleton';

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

const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<number>(7);

    useEffect(() => {
        const fetchData = async () => {
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
        };
        fetchData();
    }, [period]);

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

    const statsCards = [
        { label: 'Total Laporan', value: data.totalLogbooks, icon: BookOpen, color: 'blue' },
        { label: 'Hari Ini', value: data.todayLogbooks, icon: Calendar, color: 'green' },
        { label: 'Total Driver', value: data.totalDrivers, icon: Users, color: 'purple' },
        { label: 'Total Unit', value: data.totalUnits, icon: Truck, color: 'yellow' },
    ];

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

                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value))}
                        className="bg-transparent border-none text-sm font-medium text-gray-600 focus:ring-0 cursor-pointer py-1 px-3"
                    >
                        <option value="7">7 Hari Terakhir</option>
                        <option value="30">30 Hari Terakhir</option>
                        <option value="90">3 Bulan Terakhir</option>
                        <option value={differenceInDays(new Date(), startOfMonth(new Date())) + 1}>Bulan Ini</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statsCards.map((stat) => (
                    <div key={stat.label} className="bg-white p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className={`bg-${stat.color}-100 p-2 rounded-lg`}>
                                <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cost Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
                    <div className="flex items-center gap-2 text-blue-100">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Total Biaya (Semua)</span>
                    </div>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(data.totalCost)}</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
                    <div className="flex items-center gap-2 text-green-100">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Biaya Hari Ini</span>
                    </div>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(data.todayCost)}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Logbook Bar Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Laporan {period} Hari Terakhir</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Jumlah" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Status Pie Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Status Laporan</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={statusData.filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                                labelLine={{ stroke: '#666', strokeWidth: 1 }}
                            >
                                {statusData.filter(d => d.value > 0).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[statusData.findIndex(s => s.name === entry.name) % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="flex justify-center gap-4 mt-2">
                        {statusData.map((item, index) => (
                            <div key={item.name} className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cost Trend Line Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Trend Biaya {period} Hari</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000)}k`} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Line type="monotone" dataKey="cost" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="Biaya" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Drivers Horizontal Bar */}
                <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Top 5 Driver (Biaya)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topDrivers} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000)}k`} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Bar dataKey="cost" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Total Biaya" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Logbooks */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Laporan Terbaru</h3>
                <div className="space-y-3">
                    {recentLogbooks.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">Belum ada laporan</p>
                    ) : (
                        recentLogbooks.map(log => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{log.client_name} - {log.rute}</p>
                                    <p className="text-sm text-gray-500">
                                        {log.driver_name} • {format(new Date(log.date), 'dd MMM yyyy', { locale: id })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        log.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {log.status === 'approved' ? 'OK' : log.status === 'rejected' ? 'Tolak' : 'Pending'}
                                    </span>
                                    <p className="text-sm text-gray-500 mt-1">{formatCurrency(log.toll_cost + log.operational_cost)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
