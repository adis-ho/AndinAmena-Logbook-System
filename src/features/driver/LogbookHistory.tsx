import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { LogbookEntry, Unit } from '../../types';
import { History, CheckCircle, XCircle, Clock, Pencil, X } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface EditFormData {
    date: string;
    unit_id: string;
    start_km: number;
    end_km: number;
    activities: string;
    fuel_cost: number;
    toll_cost: number;
    parking_cost: number;
    other_cost: number;
}

export default function LogbookHistory() {
    const { user } = useAuth();
    const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLogbook, setEditingLogbook] = useState<LogbookEntry | null>(null);
    const [formData, setFormData] = useState<EditFormData | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        try {
            const [logsData, unitsData] = await Promise.all([
                ApiService.getLogbooksByDriverId(user.id),
                ApiService.getUnits()
            ]);
            setLogbooks(logsData);
            setUnits(unitsData);
        } catch (err) {
            console.error('Failed to fetch logbooks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const getUnitInfo = (unitId: string) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return '-';
        return `${unit.name} (${unit.plate_number})`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const getStatusBadge = (status: LogbookEntry['status']) => {
        const config = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft', icon: Clock },
            submitted: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', icon: Clock },
            approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Disetujui', icon: CheckCircle },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Ditolak', icon: XCircle }
        };
        const statusConfig = config[status] || config.submitted;
        const { bg, text, label, icon: Icon } = statusConfig;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
                <Icon className="h-3 w-3" />
                {label}
            </span>
        );
    };

    const canEdit = (_status: LogbookEntry['status']) => {
        // Allow edit for all statuses - will require re-approval after edit
        return true;
    };

    const handleEdit = (logbook: LogbookEntry) => {
        setEditingLogbook(logbook);
        setFormData({
            date: logbook.date.split('T')[0],
            unit_id: logbook.unit_id,
            start_km: logbook.start_km,
            end_km: logbook.end_km,
            activities: logbook.activities,
            fuel_cost: logbook.fuel_cost,
            toll_cost: logbook.toll_cost,
            parking_cost: logbook.parking_cost,
            other_cost: logbook.other_cost
        });
    };

    const handleCloseEdit = () => {
        setEditingLogbook(null);
        setFormData(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLogbook || !formData) return;

        setFormLoading(true);
        try {
            const totalKm = formData.end_km - formData.start_km;
            const totalCost = formData.fuel_cost + formData.toll_cost + formData.parking_cost + formData.other_cost;

            await ApiService.updateLogbook(editingLogbook.id, {
                ...formData,
                total_km: totalKm,
                total_cost: totalCost,
                status: 'submitted' // Re-submit after edit
            });

            handleCloseEdit();
            fetchData();
        } catch (err) {
            alert('Gagal menyimpan perubahan');
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const totalKm = formData ? formData.end_km - formData.start_km : 0;
    const totalCost = formData ? formData.fuel_cost + formData.toll_cost + formData.parking_cost + formData.other_cost : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <History className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Riwayat Logbook</h1>
            </div>

            {/* Edit Modal */}
            {editingLogbook && formData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Edit Logbook</h2>
                            <button onClick={handleCloseEdit} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                                        {units.map(unit => (
                                            <option key={unit.id} value={unit.id}>{unit.name} - {unit.plate_number}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">KM Awal</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.start_km || ''}
                                        onChange={(e) => setFormData({ ...formData, start_km: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">KM Akhir</label>
                                    <input
                                        type="number"
                                        required
                                        min={formData.start_km}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.end_km || ''}
                                        onChange={(e) => setFormData({ ...formData, end_km: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total KM</label>
                                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700">
                                        {totalKm} km
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kegiatan</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    value={formData.activities}
                                    onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya BBM</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.fuel_cost || ''}
                                        onChange={(e) => setFormData({ ...formData, fuel_cost: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Tol</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.toll_cost || ''}
                                        onChange={(e) => setFormData({ ...formData, toll_cost: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Parkir</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.parking_cost || ''}
                                        onChange={(e) => setFormData({ ...formData, parking_cost: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Lain</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.other_cost || ''}
                                        onChange={(e) => setFormData({ ...formData, other_cost: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-blue-900">Total Biaya:</span>
                                    <span className="text-xl font-bold text-blue-600">
                                        Rp {totalCost.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseEdit}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                                >
                                    {formLoading ? 'Menyimpan...' : 'Simpan & Submit Ulang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {logbooks.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Belum ada riwayat logbook</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {logbooks.map(log => (
                        <div key={log.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {format(new Date(log.date), 'EEEE, dd MMMM yyyy', { locale: id })}
                                    </p>
                                    <p className="text-sm text-gray-500">{getUnitInfo(log.unit_id)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge(log.status)}
                                    {canEdit(log.status) && (
                                        <button
                                            onClick={() => handleEdit(log)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Logbook"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="text-gray-700 mb-3">{log.activities}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-gray-500">Jarak: </span>
                                    <span className="font-medium">{log.total_km} km</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-gray-500">BBM: </span>
                                    <span className="font-medium">{formatCurrency(log.fuel_cost)}</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded">
                                    <span className="text-gray-500">Tol: </span>
                                    <span className="font-medium">{formatCurrency(log.toll_cost)}</span>
                                </div>
                                <div className="bg-blue-50 p-2 rounded">
                                    <span className="text-blue-700">Total: </span>
                                    <span className="font-bold text-blue-700">{formatCurrency(log.total_cost)}</span>
                                </div>
                            </div>

                            {log.status === 'rejected' && (
                                <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                                    ⚠️ Logbook ini ditolak. Silakan edit dan submit ulang.
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
