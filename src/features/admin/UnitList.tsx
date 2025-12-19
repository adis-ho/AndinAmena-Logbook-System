import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { Unit } from '../../types';
import { Plus, Pencil, Trash2, Truck, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SkeletonManagementList } from '../../components/ui/Skeleton';

type FormMode = 'add' | 'edit' | null;

export default function UnitList() {
    const { showToast } = useToast();
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formMode, setFormMode] = useState<FormMode>(null);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        plate_number: '',
        status: 'available' as Unit['status']
    });
    const [formLoading, setFormLoading] = useState(false);

    const fetchUnits = async () => {
        try {
            const data = await ApiService.getUnits();
            setUnits(data);
        } catch (err) {
            setError('Gagal memuat data unit');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', plate_number: '', status: 'available' });
        setFormMode(null);
        setEditingUnit(null);
    };

    const handleAdd = () => {
        resetForm();
        setFormMode('add');
    };

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setFormData({
            name: unit.name,
            plate_number: unit.plate_number,
            status: unit.status
        });
        setFormMode('edit');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (formMode === 'add') {
                await ApiService.createUnit(formData);
            } else if (formMode === 'edit' && editingUnit) {
                await ApiService.updateUnit(editingUnit.id, formData);
            }
            showToast('success', formMode === 'add' ? 'Unit berhasil ditambahkan' : 'Unit berhasil diupdate');
            resetForm();
            fetchUnits();
        } catch (err) {
            showToast('error', formMode === 'add' ? 'Gagal menambah unit' : 'Gagal mengupdate unit');
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus unit ini?')) return;

        try {
            await ApiService.deleteUnit(id);
            setUnits(units.filter(u => u.id !== id));
            showToast('success', 'Unit berhasil dihapus');
        } catch (err) {
            showToast('error', 'Gagal menghapus unit');
            console.error(err);
        }
    };

    const getStatusBadge = (status: Unit['status']) => {
        const styles: Record<Unit['status'], string> = {
            available: 'bg-green-100 text-green-700',
            'in-use': 'bg-yellow-100 text-yellow-700',
            maintenance: 'bg-red-100 text-red-700'
        };
        const labels: Record<Unit['status'], string> = {
            available: 'Tersedia',
            'in-use': 'Digunakan',
            maintenance: 'Maintenance'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
    };

    if (loading) {
        return <SkeletonManagementList />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Truck className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Unit</h1>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Unit
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

            {/* Modal Form */}
            {formMode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md relative">
                        <button onClick={resetForm} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                        <h2 className="text-xl font-bold mb-4">
                            {formMode === 'add' ? 'Tambah Unit Baru' : 'Edit Unit'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Unit</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Avanza 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plat Nomor</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.plate_number}
                                    onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                                    placeholder="Contoh: B 1234 ABC"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Unit['status'] })}
                                >
                                    <option value="available">Tersedia</option>
                                    <option value="in-use">Digunakan</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {formLoading ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Nama Unit</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Plat Nomor</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">
                                        Belum ada unit
                                    </td>
                                </tr>
                            ) : (
                                units.map(unit => (
                                    <tr key={unit.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-gray-900">{unit.name}</td>
                                        <td className="py-3 px-4 text-gray-600">{unit.plate_number}</td>
                                        <td className="py-3 px-4">{getStatusBadge(unit.status)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(unit)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(unit.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
