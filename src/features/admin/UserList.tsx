import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import type { User, UserRole } from '../../types';
import { Plus, Pencil, Trash2, X, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SkeletonManagementList } from '../../components/ui/Skeleton';
import Select from '../../components/ui/Select';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import { MIN_PASSWORD_LENGTH } from '../../constants';
import { queryKeys } from '../../lib/queryKeys';

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
    const queryClient = useQueryClient();
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
    const modalRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (!formMode) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                resetForm();
                return;
            }

            if (e.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [formMode]);

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
            await queryClient.invalidateQueries({ queryKey: queryKeys.users });
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
            await queryClient.invalidateQueries({ queryKey: queryKeys.users });
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
            await queryClient.invalidateQueries({ queryKey: queryKeys.users });
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
            await queryClient.invalidateQueries({ queryKey: queryKeys.users });
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Manajemen Pengguna</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola data, akun, dan peran akses pengguna dalam sistem</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-4 py-2.5 min-h-[44px] rounded-xl font-semibold tracking-wide transition-all shadow-sm"
                >
                    <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    <span>Tambah Pengguna</span>
                </button>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Modal Form */}
            {formMode && (
                <div
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="user-modal-title"
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-modal-backdrop"
                    style={{ overscrollBehavior: 'contain' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) resetForm();
                    }}
                >
                    <div className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] animate-modal-content">
                        <div className="border-b border-gray-100 p-6 flex items-start justify-between shrink-0">
                            <div>
                                <h2 id="user-modal-title" className="text-lg font-bold text-gray-900 tracking-tight">
                                    {formMode === 'add' ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {formMode === 'add' ? 'Lengkapi data identitas pengguna' : 'Perbarui informasi pengguna'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={resetForm}
                                aria-label="Tutup form"
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-95 transition-all rounded-lg p-1.5"
                            >
                                <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                            <div className="p-6 space-y-5 bg-white overflow-y-auto">
                                {formMode === 'add' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="user_email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email *</label>
                                            <input
                                                id="user_email"
                                                type="email"
                                                required
                                                spellCheck={false}
                                                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium text-gray-900 outline-none placeholder:text-gray-400"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="email@contoh.com"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="user_password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Password *</label>
                                            <input
                                                id="user_password"
                                                type="password"
                                                required
                                                spellCheck={false}
                                                minLength={MIN_PASSWORD_LENGTH}
                                                aria-describedby="password-hint"
                                                className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium text-gray-900 outline-none placeholder:text-gray-400"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
                                            />
                                            <p id="password-hint" className="text-xs text-gray-500 mt-1">Gunakan minimal {MIN_PASSWORD_LENGTH} karakter.</p>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="user_full_name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nama Lengkap *</label>
                                        <input
                                            id="user_full_name"
                                            type="text"
                                            required
                                            spellCheck={false}
                                            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium text-gray-900 outline-none placeholder:text-gray-400"
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="Nama Lengkap"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="user_username" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Username *</label>
                                        <input
                                            id="user_username"
                                            type="text"
                                            required
                                            spellCheck={false}
                                            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium text-gray-900 outline-none placeholder:text-gray-400"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="username_unik"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="user_role" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Peran (Role) *</label>
                                        <div className="relative">
                                            <Select
                                                id="user_role"
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
                                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 bg-white font-medium rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
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
                                <th className="text-left py-4 px-6 text-xs uppercase tracking-wider font-bold text-gray-600 border-none w-1/2">Identitas Pengguna</th>
                                <th className="text-left py-4 px-6 text-xs uppercase tracking-wider font-bold text-gray-600 border-none">Peran</th>
                                <th className="text-center py-4 px-6 text-xs uppercase tracking-wider font-bold text-gray-600 border-none">Status</th>
                                <th className="text-right py-4 px-6 text-xs uppercase tracking-wider font-bold text-gray-600 border-none">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-16 border-none">
                                        <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                                            <p className="text-sm font-semibold text-gray-900">Belum ada pengguna terdaftar</p>
                                            <p className="text-xs text-gray-500 mt-1 mb-4">Tambahkan pengguna baru untuk mengelola akses driver dan admin.</p>
                                            <button
                                                onClick={handleAdd}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-[0.98] rounded-lg transition-all"
                                            >
                                                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                                                <span>Tambah Pengguna</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="group hover:bg-slate-50/60 transition-colors">
                                        <td className="py-4 px-6 border-none">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 ${user.status === 'inactive' ? 'bg-gray-100 text-gray-400' : 'bg-slate-100 text-slate-700'}`}>
                                                    <span className="uppercase">
                                                        {user.full_name ? user.full_name.substring(0, 2) : user.username.substring(0, 2)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className={`font-medium text-sm transition-colors ${user.status === 'inactive' ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-900 group-hover:text-blue-600'}`}>
                                                        {user.full_name || 'Tanpa Nama'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 border-none">
                                            <div className={`transition-opacity ${user.status === 'inactive' ? 'opacity-50' : ''}`}>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${user.role === 'admin'
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200/80'
                                                    }`}>
                                                    {user.role === 'admin' ? 'Admin' : 'Driver'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center border-none">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${user.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                                : 'bg-rose-50 text-rose-700 border-rose-200/80'
                                                }`}>
                                                {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right border-none">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:scale-95 rounded-lg transition-all"
                                                    aria-label={`Edit pengguna ${user.username}`}
                                                >
                                                    <Pencil className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                                                </button>
                                                {user.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 rounded-lg transition-all"
                                                        aria-label={`Nonaktifkan akses pengguna ${user.username}`}
                                                    >
                                                        <UserX className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleReactivate(user.id)}
                                                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 active:scale-95 rounded-lg transition-all"
                                                            aria-label={`Aktifkan kembali pengguna ${user.username}`}
                                                        >
                                                            <UserCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleHardDeleteClick(user.id, user.full_name)}
                                                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 rounded-lg transition-all"
                                                            aria-label={`Hapus permanen pengguna ${user.username}`}
                                                        >
                                                            <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
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
            <div className="md:hidden space-y-3">
                {users.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                        <p className="text-sm font-semibold text-gray-900">Belum ada pengguna terdaftar</p>
                        <p className="text-xs text-gray-500 mt-1 mb-4">Tambahkan pengguna baru untuk mengelola akses driver dan admin.</p>
                        <button
                            onClick={handleAdd}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-[0.98] rounded-lg transition-all"
                        >
                            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                            <span>Tambah Pengguna</span>
                        </button>
                    </div>
                ) : (
                    users.map(user => (
                        <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
                            {/* Header Area */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${user.status === 'inactive' ? 'bg-gray-100 text-gray-400' : 'bg-slate-100 text-slate-700'}`}>
                                        <span className="uppercase">
                                            {user.full_name ? user.full_name.substring(0, 2) : user.username.substring(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className={`text-base font-bold tracking-tight leading-snug ${user.status === 'inactive' ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-900'}`}>
                                            {user.full_name || 'Tanpa Nama'}
                                        </h3>
                                        <span className="block text-xs text-gray-500">
                                            @{user.username}
                                        </span>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${user.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                        : 'bg-rose-50 text-rose-700 border-rose-200/80'
                                        }`}>
                                        {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="mb-4">
                                <span className="block text-xs font-semibold text-gray-500 mb-1">Peran Akses</span>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${user.role === 'admin'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                                    : 'bg-blue-50 text-blue-700 border-blue-200/80'
                                    }`}>
                                    {user.role === 'admin' ? 'Admin' : 'Driver'}
                                </span>
                            </div>
                            
                            {/* Divider */}
                            <div className="border-t border-gray-100 mb-4" />

                            {/* Action Area */}
                            <div className="mt-auto flex flex-wrap items-center justify-end gap-2">
                                <button
                                    onClick={() => handleEdit(user)}
                                    aria-label={`Edit pengguna ${user.username}`}
                                    className="px-3.5 py-2 min-h-[44px] bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-700 border border-gray-200 rounded-lg transition-all font-medium text-xs shadow-sm"
                                >
                                    Edit
                                </button>
                                {user.status === 'active' ? (
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        aria-label={`Nonaktifkan akses pengguna ${user.username}`}
                                        className="px-3.5 py-2 min-h-[44px] bg-white hover:bg-rose-50 active:scale-[0.98] text-rose-600 border border-rose-200 rounded-lg transition-all font-medium text-xs shadow-sm"
                                    >
                                        Nonaktifkan
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleReactivate(user.id)}
                                            aria-label={`Aktifkan kembali pengguna ${user.username}`}
                                            className="px-3.5 py-2 min-h-[44px] bg-white hover:bg-emerald-50 active:scale-[0.98] text-emerald-700 border border-emerald-200 rounded-lg transition-all font-medium text-xs shadow-sm"
                                        >
                                            Aktifkan
                                        </button>
                                        <button
                                            onClick={() => handleHardDeleteClick(user.id, user.full_name)}
                                            aria-label={`Hapus permanen pengguna ${user.username}`}
                                            className="px-3.5 py-2 min-h-[44px] bg-white hover:bg-rose-50 active:scale-[0.98] text-rose-600 border border-rose-200 rounded-lg transition-all font-medium text-xs shadow-sm"
                                        >
                                            Hapus
                                        </button>
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
