import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { User, UserRole } from '../../types';
import { Plus, Pencil, Trash2, Users, X, RotateCcw, Ban } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SkeletonManagementList } from '../../components/ui/Skeleton';
import Select from '../../components/ui/Select';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import { MIN_PASSWORD_LENGTH } from '../../constants';

type FormMode = 'add' | 'edit' | null;

interface UserFormData {
    email: string;
    password: string;
    username: string;
    full_name: string;
    role: UserRole;
}

export default function UserList() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formMode, setFormMode] = useState<FormMode>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserFormData>({
        email: '',
        password: '',
        username: '',
        full_name: '',
        role: 'driver'
    });
    const [formLoading, setFormLoading] = useState(false);

    // State for Hard Delete Modal
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string; userName: string }>({
        isOpen: false,
        userId: '',
        userName: ''
    });

    const fetchUsers = async () => {
        try {
            const data = await ApiService.getUsers();
            setUsers(data);
        } catch (err) {
            setError('Gagal memuat data pengguna');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const resetForm = () => {
        setFormData({ email: '', password: '', username: '', full_name: '', role: 'driver' });
        setFormMode(null);
        setEditingUser(null);
    };

    const handleAdd = () => {
        resetForm();
        setFormMode('add');
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: '',
            password: '',
            username: user.username,
            full_name: user.full_name,
            role: user.role
        });
        setFormMode('edit');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (formMode === 'add') {
                if (!formData.email || !formData.password) {
                    showToast('error', 'Email dan password wajib diisi');
                    setFormLoading(false);
                    return;
                }
                await ApiService.createUser({
                    email: formData.email,
                    password: formData.password,
                    username: formData.username,
                    full_name: formData.full_name,
                    role: formData.role
                });
            } else if (formMode === 'edit' && editingUser) {
                await ApiService.updateUser(editingUser.id, {
                    username: formData.username,
                    full_name: formData.full_name,
                    role: formData.role
                });
            }
            showToast('success', formMode === 'add' ? 'Pengguna berhasil ditambahkan' : 'Pengguna berhasil diupdate');
            resetForm();
            fetchUsers();
        } catch (err) {
            showToast('error', formMode === 'add' ? 'Gagal menambah pengguna' : 'Gagal mengupdate pengguna');
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // Confirmation removed as requested

        try {
            await ApiService.deleteUser(id);
            setUsers(users.map(u => u.id === id ? { ...u, status: 'inactive' } : u));
            showToast('success', 'Pengguna berhasil dinonaktifkan');
        } catch (err) {
            showToast('error', 'Gagal menonaktifkan pengguna');
            console.error(err);
        }
    };

    const handleReactivate = async (id: string) => {
        try {
            await ApiService.reactivateUser(id);
            setUsers(users.map(u => u.id === id ? { ...u, status: 'active' } : u));
            showToast('success', 'Pengguna berhasil diaktifkan kembali');
        } catch (err) {
            showToast('error', 'Gagal mengaktifkan pengguna');
            console.error(err);
        }
    };

    const handleHardDeleteClick = (id: string, name: string) => {
        setDeleteModal({ isOpen: true, userId: id, userName: name });
    };

    const executeHardDelete = async () => {
        if (!deleteModal.userId) return;
        setFormLoading(true);

        try {
            await ApiService.deleteUserPermanently(deleteModal.userId);
            setUsers(users.filter(u => u.id !== deleteModal.userId));
            showToast('success', 'Pengguna berhasil dihapus permanen');
            setDeleteModal({ ...deleteModal, isOpen: false });
        } catch (err: any) {
            showToast('error', 'Gagal menghapus pengguna: ' + (err.message || 'Error unknown'));
            console.error(err);
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return <SkeletonManagementList />;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700" />
                <div className="flex items-center gap-4 relative">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center shadow-sm">
                        <Users className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manajemen Pengguna</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Kelola akses dan peran dalam sistem</p>
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="relative flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold tracking-wide hover:shadow-lg hover:shadow-blue-500/25 transition duration-300 hover:-translate-y-0.5"
                >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                    <span>Tambah Pengguna</span>
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full shrink-0 shadow-sm">
                        <Ban className="h-4 w-4 text-rose-500" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            {/* Modal Form */}
            {formMode && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    style={{ overscrollBehavior: 'contain' }}
                >
                    <div className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl border border-white/20 overflow-hidden transform transition flex flex-col max-h-[calc(100vh-2rem)]">
                        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6 relative shrink-0">
                            <button type="button" onClick={resetForm} aria-label="Tutup form" className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors bg-white rounded-full p-1 border border-gray-100 shadow-sm">
                                <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">
                                {formMode === 'add' ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}
                            </h2>
                            <p className="text-xs font-bold text-gray-400 mt-1.5 uppercase tracking-wider">
                                {formMode === 'add' ? 'Lengkapi data identitas' : 'Perbarui informasi'}
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                            <div className="p-6 space-y-5 bg-white overflow-y-auto">
                                {formMode === 'add' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="user_email" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email *</label>
                                            <input
                                                id="user_email"
                                                type="email"
                                                required
                                                spellCheck={false}
                                                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium text-gray-900 outline-none placeholder:text-gray-400"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="email@contoh.com…"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="user_password" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password *</label>
                                            <input
                                                id="user_password"
                                                type="password"
                                                required
                                                spellCheck={false}
                                                minLength={MIN_PASSWORD_LENGTH}
                                                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium text-gray-900 outline-none placeholder:text-gray-400"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter…`}
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="user_full_name" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nama Lengkap *</label>
                                        <input
                                            id="user_full_name"
                                            type="text"
                                            required
                                            spellCheck={false}
                                            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium text-gray-900 outline-none placeholder:text-gray-400"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="Nama Lengkap…"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="user_username" className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Username *</label>
                                        <input
                                            id="user_username"
                                            type="text"
                                            required
                                            spellCheck={false}
                                            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium text-gray-900 outline-none placeholder:text-gray-400"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="username_unik…"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Peran (Role) *</label>
                                        <div className="relative">
                                            <Select
                                                value={formData.role}
                                                onChange={(val) => setFormData({ ...formData, role: val as UserRole })}
                                                options={[
                                                    { value: 'driver', label: 'Driver Operasional' },
                                                    { value: 'admin', label: 'Administrator' }
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50/50 border-t border-gray-100 shrink-0">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 bg-white font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {formLoading ? (
                                            <>
                                                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                                Memproses…
                                            </>
                                        ) : 'Simpan Data'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none w-1/2">Identitas Pengguna</th>
                                <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none">Peran</th>
                                <th className="text-center py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none">Status</th>
                                <th className="text-right py-4 px-6 text-[10px] uppercase tracking-widest font-bold text-gray-400 border-none">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 border-none">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 shadow-sm">
                                                <Users className="h-8 w-8 text-gray-300" aria-hidden="true" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-900">Belum ada pengguna terdaftar</p>
                                            <p className="text-xs font-medium text-gray-500 mt-1">Tambahkan data pengguna baru.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 border-none">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm ring-1 ring-inset shrink-0 transition ${user.status === 'inactive' ? 'bg-gray-50 border-gray-200 ring-gray-900/5 grayscale opacity-60' : 'bg-gradient-to-br from-slate-100 to-white border-white ring-slate-900/5 group-hover:shadow-md'}`}>
                                                    <span className={`text-xs font-bold uppercase ${user.status === 'inactive' ? 'text-gray-400' : 'text-slate-700'}`}>
                                                        {user.full_name ? user.full_name.substring(0, 2) : user.username.substring(0, 2)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className={`font-semibold text-sm mb-0.5 transition-colors ${user.status === 'inactive' ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-900 group-hover:text-blue-600'}`}>
                                                        {user.full_name || 'Tanpa Nama'}
                                                    </p>
                                                    <p className="text-[11px] font-medium text-gray-400 tracking-wide">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 border-none">
                                            <div className={`transition-opacity ${user.status === 'inactive' ? 'opacity-50' : ''}`}>
                                                <span className={`inline-flex px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin'
                                                    ? 'bg-purple-50 text-purple-600 border-purple-200/60'
                                                    : 'bg-blue-50 text-blue-600 border-blue-200/60'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center border-none">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${user.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60 shadow-sm shadow-emerald-100/50'
                                                : 'bg-rose-50 text-rose-600 border-rose-200/60 opacity-80'
                                                }`}>
                                                {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right border-none">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                    aria-label={`Edit pengguna ${user.username}`}
                                                >
                                                    <Pencil className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                                {user.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                                        aria-label={`Nonaktifkan akses pengguna ${user.username}`}
                                                    >
                                                        <Ban className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleReactivate(user.id)}
                                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                                            aria-label={`Aktifkan kembali pengguna ${user.username}`}
                                                        >
                                                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleHardDeleteClick(user.id, user.full_name)}
                                                            className="p-2 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition-colors"
                                                            aria-label={`Hapus permanen pengguna ${user.username}`}
                                                        >
                                                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards - Show on mobile only */}
            <div className="md:hidden space-y-4">
                {users.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                        <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-sm font-medium text-gray-500">Belum ada pengguna terdaftar</p>
                    </div>
                ) : (
                    users.map(user => (
                        <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
                            <div className={`flex justify-between items-start mb-5 relative z-10 transition-opacity ${user.status === 'inactive' ? 'opacity-60' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-white flex items-center justify-center border border-white shadow-sm ring-1 ring-slate-900/5">
                                        <span className="text-xs font-bold uppercase text-slate-600">
                                            {user.full_name ? user.full_name.substring(0, 2) : user.username.substring(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{user.full_name || 'Tanpa Nama'}</p>
                                        <p className="text-[11px] font-medium text-gray-500 tracking-wide">@{user.username}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' : 'bg-rose-50 text-rose-600 border-rose-200/50'
                                    }`}>
                                    {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>

                            <div className={`flex items-center gap-2 mb-4 transition-opacity ${user.status === 'inactive' ? 'opacity-50' : ''}`}>
                                <span className={`inline-flex px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin'
                                    ? 'bg-purple-50 text-purple-600 border-purple-200/60'
                                    : 'bg-blue-50 text-blue-600 border-blue-200/60'
                                    }`}>
                                    {user.role}
                                </span>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100/80">
                                <button onClick={() => handleEdit(user)} className="px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors">Edit</button>
                                {user.status === 'active' ? (
                                    <button onClick={() => handleDelete(user.id)} className="px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors">Nonaktifkan</button>
                                ) : (
                                    <>
                                        <button onClick={() => handleReactivate(user.id)} className="px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors truncate">Aktifkan Ht.</button>
                                        <button onClick={() => handleHardDeleteClick(user.id, user.full_name)} className="px-4 py-2 text-white bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold transition-colors shadow-sm focus:ring-2 focus:ring-rose-500/20">Hapus</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={executeHardDelete}
                title="Hapus Permanen Pengguna?"
                description={`Tindakan ini akan menghapus "${deleteModal.userName}" secara permanen dari sistem.`}
                warningText="Peringatan: Semua data logbook yang terkait dengan pengguna ini akan ikut terhapus dan sama sekali tidak bisa dikembalikan."
                loading={formLoading}
            />
        </div>
    );
}
