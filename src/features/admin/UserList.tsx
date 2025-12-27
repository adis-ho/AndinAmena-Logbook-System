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
        if (!confirm('Yakin ingin menonaktifkan pengguna ini?')) return;

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-blue-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-5 w-5 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Tambah Pengguna</span>
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
                            {formMode === 'add' ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {formMode === 'add' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="email@contoh.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={MIN_PASSWORD_LENGTH}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
                                        />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Nama Lengkap"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="Username"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <Select
                                    value={formData.role}
                                    onChange={(val) => setFormData({ ...formData, role: val as UserRole })}
                                    options={[
                                        { value: 'driver', label: 'Driver' },
                                        { value: 'admin', label: 'Admin' }
                                    ]}
                                />
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

            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Username</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Nama Lengkap</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Role</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">
                                        Belum ada pengguna
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${user.status === 'inactive' ? 'opacity-50' : ''}`}>
                                        <td className="py-3 px-4 text-gray-900">{user.username}</td>
                                        <td className="py-3 px-4 text-gray-600">{user.full_name}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {user.role === 'admin' ? 'Admin' : 'Driver'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                {user.status === 'active' ? (
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Nonaktifkan"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleReactivate(user.id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Aktifkan Kembali"
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleHardDeleteClick(user.id, user.full_name)}
                                                            className="p-2 text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                                                            title="Hapus Permanen"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Belum ada pengguna</p>
                    </div>
                ) : (
                    users.map(user => (
                        <div key={user.id} className={`bg - white rounded - xl shadow - sm border border - gray - 100 p - 4 ${user.status === 'inactive' ? 'opacity-60' : ''} `}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-semibold text-gray-900">{user.full_name}</p>
                                    <p className="text-sm text-gray-500">@{user.username}</p>
                                </div>
                                <span className={`px - 2 py - 1 rounded - full text - xs font - medium ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} `}>
                                    {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`px - 2 py - 1 rounded - full text - xs font - medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} `}>
                                    {user.role === 'admin' ? 'Admin' : 'Driver'}
                                </span>
                            </div>
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                <button onClick={() => handleEdit(user)} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium">Edit</button>
                                {user.status === 'active' ? (
                                    <button onClick={() => handleDelete(user.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium">Nonaktifkan</button>
                                ) : (
                                    <>
                                        <button onClick={() => handleReactivate(user.id)} className="px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium">Aktifkan</button>
                                        <button onClick={() => handleHardDeleteClick(user.id, user.full_name)} className="px-3 py-1.5 text-red-900 hover:bg-red-100 rounded-lg text-sm font-medium">Hapus</button>
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
                title="Konfirmasi Hapus Pengguna"
                description={`Apakah Anda yakin ingin menghapus "${deleteModal.userName}" dari sistem ? `}
                warningText="Dengan menghapus pengguna ini, semua data logbook terkait juga akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
                loading={formLoading}
            />
        </div>
    );
}
