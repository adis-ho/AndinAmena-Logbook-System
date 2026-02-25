import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Unit, Etoll } from '../../types';
import { Wallet, Activity, CreditCard, ChevronRight } from 'lucide-react';
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

            alert('Laporan berhasil disimpan');
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
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <div className="pt-2 sm:pt-4">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Input Laporan Harian</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="selectDate" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Tanggal</label>
                        <DatePicker
                            id="selectDate"
                            required
                            value={formData.date}
                            onChange={(date) => setFormData({ ...formData, date })}
                        />
                    </div>
                    <div>
                        <label htmlFor="selectUnit" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2 flex items-center gap-1">Unit Kendaraan <span className="text-rose-500">*</span></label>
                        <Select
                            id="selectUnit"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                    <div>
                        <label htmlFor="inputClient" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Penyewa (Tamu/Client)</label>
                        <input
                            id="inputClient"
                            name="client_name"
                            autoComplete="name"
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium text-gray-900 placeholder:text-gray-400"
                            placeholder="Nama tamu..."
                            value={formData.client_name}
                            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label htmlFor="inputRoute" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Rute Perjalanan</label>
                        <input
                            id="inputRoute"
                            name="route"
                            autoComplete="off"
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium text-gray-900 placeholder:text-gray-400"
                            placeholder="Contoh: Jakarta - Bandung"
                            value={formData.rute}
                            onChange={(e) => setFormData({ ...formData, rute: e.target.value })}
                        />
                    </div>
                </div>



                <div className="bg-slate-50 border border-slate-100 p-6 md:p-8 rounded-[1.5rem] space-y-6">
                    <h3 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2 mb-2">
                        <Wallet className="h-5 w-5 text-blue-500" aria-hidden="true" />
                        Rincian Biaya Perjalanan
                    </h3>

                    {/* E-Toll Selection */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2">
                            <label htmlFor="selectEtoll" className="block text-[10px] uppercase tracking-widest font-black text-gray-400">Kartu E-Toll (Opsional)</label>
                            <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100/50">
                                <CreditCard className="h-3 w-3 text-blue-500" aria-hidden="true" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600/70">Saldo E-Toll:</span>
                                <span className="text-sm font-black text-blue-700 tabular-nums">
                                    {formData.etoll_id
                                        ? formatCurrency(etolls.find(e => e.id === formData.etoll_id)?.balance || 0)
                                        : '-'
                                    }
                                </span>
                            </div>
                        </div>
                        <Select
                            id="selectEtoll"
                            value={formData.etoll_id}
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
                        {/* Toll Cost */}
                        <div>
                            <label htmlFor="inputTollCost" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Biaya Tol & Parkir (Dari E-Toll)</label>
                            <input
                                id="inputTollCost"
                                name="toll_cost"
                                type="number"
                                min="0"
                                step="1"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-black text-gray-900 tabular-nums placeholder:text-gray-300 placeholder:font-medium"
                                placeholder="Rp 0"
                                value={formData.toll_cost || ''}
                                onChange={(e) => setFormData({ ...formData, toll_cost: Math.round(Number(e.target.value)) || 0 })}
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            />
                        </div>

                        {/* Biaya Lain */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="inputOpsCost" className="block text-[10px] uppercase tracking-widest font-black text-gray-400">Biaya Opr Lain</label>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70">Saldo Opr:</span>
                                    <span className="text-xs font-black text-emerald-600 tabular-nums">{formatCurrency(user?.operational_balance || 0)}</span>
                                </div>
                            </div>
                            <input
                                id="inputOpsCost"
                                name="operational_cost"
                                type="number"
                                min="0"
                                step="1"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all duration-300 font-black text-gray-900 tabular-nums placeholder:text-gray-300 placeholder:font-medium"
                                placeholder="Rp 0"
                                value={formData.operational_cost || ''}
                                onChange={(e) => setFormData({ ...formData, operational_cost: Math.round(Number(e.target.value)) || 0 })}
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            />
                        </div>
                    </div>
                </div >

                <div className="pt-2">
                    <label htmlFor="inputKeterangan" className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2">Keterangan Tambahan</label>
                    <textarea
                        id="inputKeterangan"
                        name="keterangan"
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium text-gray-700 resize-none placeholder:text-gray-400"
                        placeholder="Tulis catatan jika ada pengeluaran khusus..."
                        value={formData.keterangan}
                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    />
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 rounded-[1.5rem] shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors duration-500"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-widest text-blue-100 mb-1 opacity-90"><Activity className="inline-block h-3.5 w-3.5 mr-1" aria-hidden="true" />Total Biaya</span>
                            <span className="text-3xl md:text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-sm">
                                {formatCurrency(totalCost)}
                            </span>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`
                                flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all duration-300
                                ${loading
                                    ? 'bg-blue-800 text-blue-200 cursor-not-allowed'
                                    : 'bg-white text-blue-600 hover:bg-blue-50 active:scale-[0.98] shadow-lg shadow-black/10'
                                }
                            `}
                        >
                            {loading ? 'Menyimpan…' : (
                                <>Simpan Laporan <ChevronRight className="h-4 w-4" aria-hidden="true" /></>
                            )}
                        </button>
                    </div>
                </div>
            </form >
        </div >
    );
}
