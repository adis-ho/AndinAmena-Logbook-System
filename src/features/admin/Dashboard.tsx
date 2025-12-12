export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Logbooks</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-2">128</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Active Drivers</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-2">12</p>
                </div>
            </div>
        </div>
    );
}
