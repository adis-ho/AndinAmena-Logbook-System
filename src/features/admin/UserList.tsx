import { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { User, UserRole } from '../../types';
import { Plus, Pencil, Trash2, Users, X, RotateCcw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SkeletonManagementList } from '../../components/ui/Skeleton';

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
                    alert('Email dan password wajib diisi');
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
            resetForm();
            fetchUsers();
        } catch (err) {
            alert(formMode === 'add' ? 'Gagal menambah pengguna' : 'Gagal mengupdate pengguna');
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
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Pengguna
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
                                            minLength={6}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Minimal 6 karakter"
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
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                >
                                    <option value="driver">Driver</option>
                                    <option value="admin">Admin</option>
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
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReactivate(user.id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Aktifkan Kembali"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </button>
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
        </div>
    );
}
