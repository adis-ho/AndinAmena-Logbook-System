import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Unit, Etoll } from '../../types';
import { BookPlus, Wallet } from 'lucide-react';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';

export default function LogbookForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [units, setUnits] = useState<Unit[]>([]);
    const [etolls, setEtolls] = useState<Etoll[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        unit_id: '',
        etoll_id: '',
        client_name: '',
        rute: '',
        keterangan: '',
        toll_cost: 0,
        parking_cost: 0,
        operational_cost: 0
    });

    useEffect(() => {
        Promise.all([
            ApiService.getUnits(),
            ApiService.getActiveEtolls()
        ]).then(([unitsData, etollsData]) => {
            setUnits(unitsData);
            setEtolls(etollsData);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!formData.unit_id) {
            alert('Silakan pilih unit kendaraan');
            return;
        }

        setLoading(true);
        try {
            await ApiService.createLogbook({
                ...formData,
                etoll_id: formData.etoll_id || undefined,
                driver_id: user.id,
                status: 'submitted'
            });

            // Notify semua admin tentang logbook baru
            await ApiService.notifyAdmins({
                type: 'logbook_submitted',
                title: 'Laporan Harian Baru',
                message: `${user.full_name} telah submit laporan untuk tanggal ${formData.date}`,
                link: '/admin/logbooks'
            });

            navigate('/driver/history');
        } catch (err) {
            alert('Gagal menyimpan laporan');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalCost = formData.toll_cost + formData.operational_cost;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <BookPlus className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Input Laporan Harian</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <DatePicker
                            required
                            value={formData.date}
                            onChange={(date) => setFormData({ ...formData, date })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Kendaraan *</label>
                        <Select
                            value={formData.unit_id}
                            onChange={(val) => setFormData({ ...formData, unit_id: val })}
                            options={[
                                { value: '', label: 'Pilih Unit', disabled: true },
                                ...units.filter(u => u.status === 'available').map(unit => ({
                                    value: unit.id,
                                    label: `${unit.name} - ${unit.plate_number}`
                                }))
                            ]}
                            placeholder="Pilih Unit"
                        />
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

                {/* E-Toll Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kartu E-Toll (Opsional)</label>
                    <Select
                        value={formData.etoll_id}
                        onChange={(val) => setFormData({ ...formData, etoll_id: val })}
                        options={[
                            { value: '', label: '-- Tidak Menggunakan E-Toll --' },
                            ...etolls.map(etoll => ({
                                value: etoll.id,
                                label: `${etoll.card_name} ${etoll.card_number ? `(${etoll.card_number})` : ''} - Saldo: Rp ${etoll.balance.toLocaleString('id-ID')}`
                            }))
                        ]}
                        placeholder="Pilih E-Toll"
                    />
                </div>

                {/* Toll Cost */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Tol</label>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Rp 0"
                        value={formData.toll_cost || ''}
                        onChange={(e) => setFormData({ ...formData, toll_cost: Math.round(Number(e.target.value)) || 0 })}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                </div>

                {/* Biaya Lain */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">Biaya Lain</label>
                        <div className="flex items-center gap-1 text-sm">
                            <Wallet className="h-4 w-4 text-green-600" />
                            <span className="text-gray-500">Saldo:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(user?.operational_balance || 0)}</span>
                        </div>
                    </div>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Rp 0"
                        value={formData.operational_cost || ''}
                        onChange={(e) => setFormData({ ...formData, operational_cost: Math.round(Number(e.target.value)) || 0 })}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-900">Total Biaya:</span>
                        <span className="text-xl font-bold text-blue-600">
                            Rp {totalCost.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                    {loading ? 'Menyimpan...' : 'Simpan Laporan'}
                </button>
            </form >
        </div >
    );
}
