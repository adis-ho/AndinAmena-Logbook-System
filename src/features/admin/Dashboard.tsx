import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { LogbookEntry, User } from '../../types';
import { LayoutDashboard, BookOpen, Users, Truck, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format, subDays, startOfDay, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { id } from 'date-fns/locale';

interface DashboardStats {
    totalLogbooks: number;
    todayLogbooks: number;
    weekLogbooks: number;
    monthLogbooks: number;
    totalDrivers: number;
    totalUnits: number;
    totalCost: number;
    todayCost: number;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalLogbooks: 0, todayLogbooks: 0, weekLogbooks: 0, monthLogbooks: 0,
        totalDrivers: 0, totalUnits: 0, totalCost: 0, todayCost: 0
    });
    const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [dailyData, setDailyData] = useState<{ date: string; count: number; cost: number }[]>([]);
    const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
    const [driverData, setDriverData] = useState<{ name: string; cost: number }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [logsData, usersData, unitsData] = await Promise.all([
                    ApiService.getLogbooks(),
                    ApiService.getUsers(),
                    ApiService.getUnits()
                ]);

                setLogbooks(logsData);
                setUsers(usersData);

                const drivers = usersData.filter((u: User) => u.role === 'driver');
                const today = startOfDay(new Date());

                const todayLogs = logsData.filter((l: LogbookEntry) => isToday(new Date(l.date)));
                const weekLogs = logsData.filter((l: LogbookEntry) => isThisWeek(new Date(l.date)));
                const monthLogs = logsData.filter((l: LogbookEntry) => isThisMonth(new Date(l.date)));

                setStats({
                    totalLogbooks: logsData.length,
                    todayLogbooks: todayLogs.length,
                    weekLogbooks: weekLogs.length,
                    monthLogbooks: monthLogs.length,
                    totalDrivers: drivers.length,
                    totalUnits: unitsData.length,
                    totalCost: logsData.reduce((sum: number, l: LogbookEntry) => sum + l.toll_parking_cost, 0),
                    todayCost: todayLogs.reduce((sum: number, l: LogbookEntry) => sum + l.toll_parking_cost, 0)
                });

                // Daily data (7 days)
                const daily: { date: string; count: number; cost: number }[] = [];
                for (let i = 6; i >= 0; i--) {
                    const date = subDays(today, i);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayLogs = logsData.filter((l: LogbookEntry) => l.date.startsWith(dateStr));
                    daily.push({
                        date: format(date, 'dd MMM', { locale: id }),
                        count: dayLogs.length,
                        cost: dayLogs.reduce((sum: number, l: LogbookEntry) => sum + l.toll_parking_cost, 0)
                    });
                }
                setDailyData(daily);

                // Status data
                const approved = logsData.filter((l: LogbookEntry) => l.status === 'approved').length;
                const pending = logsData.filter((l: LogbookEntry) => l.status === 'submitted').length;
                const rejected = logsData.filter((l: LogbookEntry) => l.status === 'rejected').length;
                setStatusData([
                    { name: 'Disetujui', value: approved },
                    { name: 'Pending', value: pending },
                    { name: 'Ditolak', value: rejected }
                ]);

                // Top 5 Driver by cost
                const driverCosts: Record<string, number> = {};
                logsData.forEach((l: LogbookEntry) => {
                    const driver = drivers.find((d: User) => d.id === l.driver_id);
                    if (driver) {
                        driverCosts[driver.full_name] = (driverCosts[driver.full_name] || 0) + l.toll_parking_cost;
                    }
                });
                const driverArr = Object.entries(driverCosts)
                    .map(([name, cost]) => ({ name, cost }))
                    .sort((a, b) => b.cost - a.cost)
                    .slice(0, 5);
                setDriverData(driverArr);

            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <LayoutDashboard className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Logbook</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalLogbooks}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Hari Ini</p>
                            <p className="text-xl font-bold text-green-600">{stats.todayLogbooks}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Driver</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalDrivers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-lg">
                            <Truck className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Unit</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalUnits}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cost Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
                    <div className="flex items-center gap-2 text-blue-100">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Total Biaya (Semua)</span>
                    </div>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalCost)}</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
                    <div className="flex items-center gap-2 text-green-100">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Biaya Hari Ini</span>
                    </div>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(stats.todayCost)}</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Logbook Bar Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Logbook 7 Hari Terakhir</h3>
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
                    <h3 className="font-bold text-gray-900 mb-4">Status Logbook</h3>
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
                    <h3 className="font-bold text-gray-900 mb-4">Trend Biaya 7 Hari</h3>
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
                        <BarChart data={driverData} layout="vertical">
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
                <h3 className="font-bold text-gray-900 mb-4">Logbook Terbaru</h3>
                <div className="space-y-3">
                    {logbooks.slice(0, 5).map(log => {
                        const driver = users.find(u => u.id === log.driver_id);
                        return (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900">{log.client_name} - {log.rute}</p>
                                    <p className="text-sm text-gray-500">
                                        {driver?.full_name} • {format(new Date(log.date), 'dd MMM yyyy', { locale: id })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        log.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {log.status === 'approved' ? 'OK' : log.status === 'rejected' ? 'Tolak' : 'Pending'}
                                    </span>
                                    <p className="text-sm text-gray-500 mt-1">{formatCurrency(log.toll_parking_cost)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
