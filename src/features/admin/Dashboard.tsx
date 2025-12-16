import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { BookOpen, Users, Truck, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardStats {
    totalLogbooks: number;
    pendingLogbooks: number;
    approvedLogbooks: number;
    totalDrivers: number;
    totalUnits: number;
    availableUnits: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalLogbooks: 0,
        pendingLogbooks: 0,
        approvedLogbooks: 0,
        totalDrivers: 0,
        totalUnits: 0,
        availableUnits: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [logbooks, users, units] = await Promise.all([
                    ApiService.getLogbooks(),
                    ApiService.getUsers(),
                    ApiService.getUnits()
                ]);

                setStats({
                    totalLogbooks: logbooks.length,
                    pendingLogbooks: logbooks.filter(l => l.status === 'submitted').length,
                    approvedLogbooks: logbooks.filter(l => l.status === 'approved').length,
                    totalDrivers: users.filter(u => u.role === 'driver').length,
                    totalUnits: units.length,
                    availableUnits: units.filter(u => u.status === 'available').length
                });
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: 'Total Logbooks',
            value: stats.totalLogbooks,
            icon: BookOpen,
            color: 'blue',
            link: '/admin/logbooks'
        },
        {
            title: 'Pending Review',
            value: stats.pendingLogbooks,
            icon: Clock,
            color: 'yellow',
            link: '/admin/logbooks'
        },
        {
            title: 'Approved',
            value: stats.approvedLogbooks,
            icon: CheckCircle,
            color: 'green',
            link: '/admin/logbooks'
        },
        {
            title: 'Total Drivers',
            value: stats.totalDrivers,
            icon: Users,
            color: 'purple',
            link: '/admin/users'
        },
        {
            title: 'Total Units',
            value: stats.totalUnits,
            icon: Truck,
            color: 'indigo',
            link: '/admin/units'
        },
        {
            title: 'Available Units',
            value: stats.availableUnits,
            icon: TrendingUp,
            color: 'emerald',
            link: '/admin/units'
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
            blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
            yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', iconBg: 'bg-yellow-100' },
            green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100' },
            purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' },
            indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', iconBg: 'bg-indigo-100' },
            emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' }
        };
        return colors[color] || colors.blue;
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
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 mt-1">Selamat datang! Berikut ringkasan data terkini.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    const colors = getColorClasses(card.color);

                    return (
                        <Link
                            key={index}
                            to={card.link}
                            className={`${colors.bg} p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                                    <p className={`text-3xl font-bold mt-2 ${colors.text}`}>{card.value}</p>
                                </div>
                                <div className={`${colors.iconBg} p-3 rounded-lg`}>
                                    <Icon className={`h-6 w-6 ${colors.text}`} />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/admin/logbooks"
                        className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-700">
                            Review {stats.pendingLogbooks} Logbook Pending
                        </span>
                    </Link>
                    <Link
                        to="/admin/users"
                        className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-700">Kelola Pengguna</span>
                    </Link>
                    <Link
                        to="/admin/units"
                        className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                        <Truck className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-700">Kelola Unit</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
