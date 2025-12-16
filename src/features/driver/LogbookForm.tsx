import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Unit } from '../../types';
import { BookPlus } from 'lucide-react';

export default function LogbookForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        unit_id: '',
        client_name: '',
        rute: '',
        keterangan: '',
        toll_parking_cost: 0
    });

    useEffect(() => {
        ApiService.getUnits().then(setUnits);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await ApiService.createLogbook({
                ...formData,
                driver_id: user.id,
                status: 'submitted'
            });

            // Notify semua admin tentang logbook baru
            await ApiService.notifyAdmins({
                type: 'logbook_submitted',
                title: 'Logbook Baru',
                message: `${user.full_name} telah submit logbook untuk tanggal ${formData.date}`,
                link: '/admin/logbooks'
            });

            navigate('/driver/history');
        } catch (err) {
            alert('Gagal menyimpan logbook');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <BookPlus className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Input Logbook</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input
                            type="date"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Kendaraan</label>
                        <select
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            value={formData.unit_id}
                            onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                        >
                            <option value="">Pilih Unit</option>
                            {units.filter(u => u.status === 'available').map(unit => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name} - {unit.plate_number}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User (Tamu/Client)</label>
                    <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nama tamu atau client..."
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rute</label>
                    <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Contoh: Jakarta - Bandung"
                        value={formData.rute}
                        onChange={(e) => setFormData({ ...formData, rute: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                    <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Catatan tambahan (opsional)..."
                        value={formData.keterangan}
                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Tol & Parkir</label>
                    <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Rp 0"
                        value={formData.toll_parking_cost || ''}
                        onChange={(e) => setFormData({ ...formData, toll_parking_cost: parseInt(e.target.value) || 0 })}
                    />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-900">Total Biaya:</span>
                        <span className="text-xl font-bold text-blue-600">
                            Rp {formData.toll_parking_cost.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                    {loading ? 'Menyimpan...' : 'Simpan Logbook'}
                </button>
            </form>
        </div>
    );
}
