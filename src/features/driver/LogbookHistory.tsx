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
    client_name: string;
    rute: string;
    keterangan: string;
    toll_parking_cost: number;
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
            console.error('Gagal mengambil logbook:', err);
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
        return true;
    };

    const handleEdit = (logbook: LogbookEntry) => {
        setEditingLogbook(logbook);
        setFormData({
            date: logbook.date.split('T')[0],
            unit_id: logbook.unit_id,
            client_name: logbook.client_name,
            rute: logbook.rute,
            keterangan: logbook.keterangan,
            toll_parking_cost: logbook.toll_parking_cost
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
            await ApiService.updateLogbook(editingLogbook.id, {
                ...formData,
                status: 'submitted'
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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <History className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Riwayat Logbook</h1>
            </div>

            {/* Modal Edit */}
            {editingLogbook && formData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Edit Logbook</h2>
                            <button onClick={handleCloseEdit} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">User (Tamu/Client)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
                                    value={formData.rute}
                                    onChange={(e) => setFormData({ ...formData, rute: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Tol & Parkir</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.toll_parking_cost || ''}
                                    onChange={(e) => setFormData({ ...formData, toll_parking_cost: Math.round(Number(e.target.value)) || 0 })}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
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

                            <div className="space-y-2 mb-3">
                                <div className="flex">
                                    <span className="text-gray-500 w-24">User:</span>
                                    <span className="text-gray-900 font-medium">{log.client_name}</span>
                                </div>
                                <div className="flex">
                                    <span className="text-gray-500 w-24">Rute:</span>
                                    <span className="text-gray-900">{log.rute}</span>
                                </div>
                                {log.keterangan && (
                                    <div className="flex">
                                        <span className="text-gray-500 w-24">Keterangan:</span>
                                        <span className="text-gray-700">{log.keterangan}</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-blue-700 font-medium">Biaya Tol & Parkir:</span>
                                    <span className="font-bold text-blue-700">{formatCurrency(log.toll_parking_cost)}</span>
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
