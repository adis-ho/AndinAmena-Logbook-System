import { useAuth } from '../../context/AuthContext';

export default function DriverDashboard() {
    const { user } = useAuth();
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white">
                <h1 className="text-2xl font-bold">Selamat Datang, {user?.full_name}</h1>
                <p className="mt-2 opacity-90">Siap untuk perjalanan hari ini?</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Ringkasan Aktivitas</h2>
                <div className="space-y-4">
                    <p className="text-gray-600">Belum ada aktivitas hari ini.</p>
                </div>
            </div>
        </div>
    );
}
