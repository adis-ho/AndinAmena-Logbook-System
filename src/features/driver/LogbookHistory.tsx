import { useEffect, useState, useMemo } from 'react';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { LogbookEntry } from '../../types';
import { History, CheckCircle, XCircle, Clock, Pencil, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import DatePicker from '../../components/ui/DatePicker';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import { SkeletonLogbookHistory } from '../../components/ui/Skeleton';
import { useActiveEtollsQuery, useUnitsQuery } from '../../hooks/useReferenceDataQueries';

export default function LogbookHistory() {
    const { user } = useAuth();
    const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
    const { data: units = [] } = useUnitsQuery(!!user);
    const { data: etolls = [] } = useActiveEtollsQuery(!!user);
    const [loading, setLoading] = useState(true);
    const [editingLogbook, setEditingLogbook] = useState<LogbookEntry | null>(null);
    const [formData, setFormData] = useState<Partial<LogbookEntry> | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [deleteLogbook, setDeleteLogbook] = useState<LogbookEntry | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Initial Fetch
    const fetchData = async () => {
        if (!user) return;
        try {
            const logsData = await ApiService.getLogbooksByDriverId(user.id);
            setLogbooks(logsData);
        } catch (err) {
            console.error('Gagal mengambil laporan:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Real-time: auto-refresh when this driver's logbooks change (approve/reject)
    useRealtimeSubscription({
        table: 'logbooks',
        events: ['UPDATE', 'DELETE'],
        filter: user ? `driver_id=eq.${user.id}` : undefined,
        onUpdate: fetchData,
        enabled: !!user,
    });

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
            draft: { bg: 'bg-gray-50 border-gray-200 text-gray-700', label: 'Draft', icon: Clock },
            submitted: { bg: 'bg-amber-50 border-amber-200 text-amber-700', label: 'Pending', icon: Clock },
            approved: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Disetujui', icon: CheckCircle },
            rejected: { bg: 'bg-rose-50 border-rose-200 text-rose-700', label: 'Ditolak', icon: XCircle }
        };
        const statusConfig = config[status] || config.submitted;
        const { bg, label, icon: Icon } = statusConfig;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${bg}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
            </span>
        );
    };

    // Calculate Paginated Data
    const paginatedLogbooks = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return logbooks.slice(startIndex, startIndex + pageSize);
    }, [logbooks, currentPage, pageSize]);

    // Reset page when data changes or deleted
    useEffect(() => {
        const totalPages = Math.ceil(logbooks.length / pageSize) || 1;
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [logbooks.length, pageSize, currentPage]);

    const canEdit = (_status: LogbookEntry['status']) => {
        return true;
    };

    const handleEdit = (logbook: LogbookEntry) => {
        setEditingLogbook(logbook);
        setFormData({
            date: logbook.date.split('T')[0],
            unit_id: logbook.unit_id,
            etoll_id: logbook.etoll_id || '',
            client_name: logbook.client_name,
            rute: logbook.rute,
            keterangan: logbook.keterangan,
            toll_cost: logbook.toll_cost,
            operational_cost: logbook.operational_cost
        });
    };

    const handleDelete = async () => {
        if (!deleteLogbook || !user) return;

        // Only allow deleting rejected logbooks
        if (deleteLogbook.status !== 'rejected') {
            alert('Hanya laporan yang ditolak yang dapat dihapus.');
            setDeleteLogbook(null);
            return;
        }

        try {
            await ApiService.deleteLogbookByDriver(deleteLogbook.id, user.id);
            setLogbooks(logbooks.filter(l => l.id !== deleteLogbook.id));
            setDeleteLogbook(null);
            alert('Laporan berhasil dihapus');
        } catch (err) {
            console.error('Delete error:', err);
            alert('Gagal menghapus laporan. Pastikan laporan ini milik Anda dan statusnya ditolak.');
        }
    };

    const handleCloseEdit = () => {
        setEditingLogbook(null);
        setFormData(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLogbook || !formData) return;
        if (!formData.unit_id) {
            alert('Silakan pilih unit kendaraan');
            return;
        }

        setFormLoading(true);
        try {
            await ApiService.updateLogbook(editingLogbook.id, {
                ...formData,
                etoll_id: formData.etoll_id || undefined,
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
        return <SkeletonLogbookHistory />;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <div className="pt-2 sm:pt-4">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Riwayat Laporan Harian</h1>
            </div>

            {/* Modal Delete Confirmation */}
            {deleteLogbook && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Hapus Laporan?</h2>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            Apakah Anda yakin ingin menghapus laporan tanggal <strong className="font-black tabular-nums">{format(new Date(deleteLogbook.date), 'dd MMMM yyyy', { locale: id })}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteLogbook(null)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-bold text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors duration-200 font-bold text-sm shadow-sm"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edit */}
            {editingLogbook && formData && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl" style={{ overscrollBehavior: 'contain' }}>
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 md:px-8 py-5 flex items-center justify-between z-10">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Edit Laporan Harian</h2>
                            <button onClick={handleCloseEdit} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200" aria-label="Tutup Edit">
                                <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="editDate" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Tanggal</label>
                                    <DatePicker
                                        id="editDate"
                                        required
                                        value={formData.date}
                                        onChange={(date) => setFormData({ ...formData, date })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="editUnit" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2 flex items-center gap-1">Unit Kendaraan <span className="text-rose-500">*</span></label>
                                    <Select
                                        id="editUnit"
                                        value={formData.unit_id || ''}
                                        onChange={(val) => setFormData({ ...formData, unit_id: val })}
                                        options={[
                                            { value: '', label: 'Pilih Unit', disabled: true },
                                            ...units.map(unit => ({ value: unit.id, label: `${unit.name} - ${unit.plate_number}` }))
                                        ]}
                                        placeholder="Pilih Unit"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                                <div>
                                    <label htmlFor="editClient" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">User (Tamu/Client)</label>
                                    <input
                                        id="editClient"
                                        name="client_name"
                                        autoComplete="name"
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium text-gray-900 placeholder:text-gray-400"
                                        value={formData.client_name || ''}
                                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="editRoute" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Rute</label>
                                    <input
                                        id="editRoute"
                                        name="route"
                                        autoComplete="off"
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium text-gray-900 placeholder:text-gray-400"
                                        value={formData.rute || ''}
                                        onChange={(e) => setFormData({ ...formData, rute: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 p-6 md:p-8 rounded-[1.5rem] space-y-6">
                                {/* E-Toll Selection */}
                                <div>
                                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2">
                                        <label htmlFor="editEtoll" className="block text-[10px] uppercase tracking-widest font-black text-gray-400">Kartu E-Toll (Opsional)</label>
                                    </div>
                                    <Select
                                        id="editEtoll"
                                        value={formData.etoll_id || ''}
                                        onChange={(val) => setFormData({ ...formData, etoll_id: val })}
                                        options={[
                                            { value: '', label: '-- Tidak Menggunakan E-Toll --' },
                                            ...etolls.map(etoll => ({
                                                value: etoll.id,
                                                label: (
                                                    <>
                                                        <span className="md:hidden">
                                                            {`${etoll.card_name}${etoll.card_number ? ` (...${etoll.card_number.slice(-4)})` : ''}`}
                                                        </span>
                                                        <span className="hidden md:inline">
                                                            {`${etoll.card_name}${etoll.card_number ? ` (${etoll.card_number})` : ''}`}
                                                        </span>
                                                    </>
                                                )
                                            }))
                                        ]}
                                        placeholder="Pilih E-Toll"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="editToll" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Biaya Tol</label>
                                        <input
                                            id="editToll"
                                            name="toll_cost"
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-black text-gray-900 tabular-nums placeholder:text-gray-300 placeholder:font-medium"
                                            value={formData.toll_cost || ''}
                                            onChange={(e) => setFormData({ ...formData, toll_cost: Math.round(Number(e.target.value)) || 0 })}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="editOps" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Biaya Lain</label>
                                        <input
                                            id="editOps"
                                            name="operational_cost"
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 font-black text-gray-900 tabular-nums placeholder:text-gray-300 placeholder:font-medium"
                                            value={formData.operational_cost || ''}
                                            onChange={(e) => setFormData({ ...formData, operational_cost: Math.round(Number(e.target.value)) || 0 })}
                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label htmlFor="editNote" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Keterangan Tambahan</label>
                                <textarea
                                    id="editNote"
                                    name="keterangan"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium text-gray-700 resize-none placeholder:text-gray-400"
                                    value={formData.keterangan}
                                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                                />
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseEdit}
                                    className="flex-1 py-3.5 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 font-bold text-sm transition-all duration-300"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 font-black text-sm tracking-wide transition-all duration-300 active:scale-[0.98] shadow-md shadow-blue-500/20"
                                >
                                    {formLoading ? 'Menyimpan…' : 'Simpan & Submit Ulang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {logbooks.length === 0 ? (
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 text-center">
                    <History className="h-12 w-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                    <p className="text-gray-500 font-medium tracking-tight">Belum ada riwayat laporan harian.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="space-y-4">
                        {paginatedLogbooks.map((log: LogbookEntry) => (
                            <div key={log.id} className="bg-white rounded-[20px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100/50 p-6 flex flex-col transition-all duration-300">
                                {/* Header Area */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-1.5">
                                            {format(new Date(log.date), 'EEEE, dd MMM', { locale: id })}
                                        </span>
                                        <h3 className="text-[22px] font-black text-gray-900 tracking-tight leading-none mb-2">
                                            {getUnitInfo(log.unit_id).split(' - ')[0] || getUnitInfo(log.unit_id)}
                                        </h3>
                                        <span className="block text-[13px] font-bold text-gray-500">
                                            {log.client_name}
                                        </span>
                                    </div>
                                    <div className="scale-[0.85] origin-top-right shrink-0">
                                        {getStatusBadge(log.status)}
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-6">
                                    <div>
                                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-1">Rute</span>
                                        <span className="block text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{log.rute}</span>
                                    </div>
                                    {log.keterangan ? (
                                        <div>
                                            <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-1">Catatan</span>
                                            <span className="block text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{log.keterangan}</span>
                                        </div>
                                    ) : (
                                        <div></div>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="h-px w-full bg-gradient-to-r from-gray-100 via-gray-100 to-transparent mb-5" />

                                {/* Cost Section (Clean, no background) */}
                                <div className="grid grid-cols-3 gap-2 items-end mb-6">
                                    <div>
                                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-1">Tol & Parkir</span>
                                        <span className="block text-[13px] font-bold text-gray-700 tabular-nums">{formatCurrency(log.toll_cost)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.1em] text-gray-400 mb-1">Opr. Lain</span>
                                        <span className="block text-[13px] font-bold text-gray-700 tabular-nums">{formatCurrency(log.operational_cost)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-blue-600 mb-1">Total Biaya</span>
                                        <span className="block text-[15px] font-black text-blue-700 tabular-nums leading-none tracking-tight">
                                            {formatCurrency(log.toll_cost + log.operational_cost)}
                                        </span>
                                    </div>
                                </div>

                                {/* Rejection Note if applicable */}
                                {log.status === 'rejected' && (
                                    <div className="mb-6 p-3 rounded-xl bg-rose-50/50 border border-rose-100/50 flex gap-2.5 items-start">
                                        <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" aria-hidden="true" />
                                        <div>
                                            <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-0.5">Ditolak</p>
                                            <p className="text-xs font-semibold text-rose-700/80 leading-snug">Edit dan submit ulang, atau hapus jika batal.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Area */}
                                <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-gray-50/80">
                                    {canEdit(log.status) && (
                                        <button
                                            onClick={() => handleEdit(log)}
                                            className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all duration-200 font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 group"
                                            aria-label="Edit Laporan"
                                        >
                                            <Pencil className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
                                            <span>Edit</span>
                                        </button>
                                    )}
                                    {log.status === 'rejected' && (
                                        <button
                                            onClick={() => setDeleteLogbook(log)}
                                            className="px-4 py-2.5 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-xl transition-all duration-200 font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2"
                                            aria-label="Hapus Laporan Ditolak"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                            <span>Hapus</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 sm:px-6">
                        <Pagination
                            currentPage={currentPage}
                            pageSize={pageSize}
                            totalItems={logbooks.length}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setCurrentPage(1); // Reset to page 1 when size changes
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
