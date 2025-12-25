import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { User, Mail, Lock, Camera, Save, Eye, EyeOff, Trash2 } from 'lucide-react';
import { MIN_PASSWORD_LENGTH } from '../../constants';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile form state
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const [savingName, setSavingName] = useState(false);

    // Email form state
    const [email, setEmail] = useState(user?.email || '');
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);

    // Password form state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // Avatar state
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const handleSaveName = async () => {
        if (!user || !fullName.trim()) return;
        setSavingName(true);
        try {
            await ApiService.updateProfile(user.id, { full_name: fullName.trim() });
            showToast('success', 'Nama berhasil diperbarui');
            setIsEditingName(false);
            refreshUser?.();
        } catch (err) {
            showToast('error', 'Gagal memperbarui nama');
            console.error(err);
        } finally {
            setSavingName(false);
        }
    };

    const handleSaveEmail = async () => {
        if (!email.trim()) return;
        setSavingEmail(true);
        try {
            await ApiService.updateEmail(email.trim());
            showToast('success', 'Email konfirmasi telah dikirim ke email baru');
            setIsEditingEmail(false);
        } catch (err) {
            showToast('error', 'Gagal memperbarui email');
            console.error(err);
        } finally {
            setSavingEmail(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            showToast('error', `Password minimal ${MIN_PASSWORD_LENGTH} karakter`);
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('error', 'Konfirmasi password tidak cocok');
            return;
        }

        setSavingPassword(true);
        try {
            await ApiService.updatePassword(oldPassword, newPassword);
            showToast('success', 'Password berhasil diperbarui');
            setShowPasswordForm(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Gagal memperbarui password';
            showToast('error', message);
            console.error(err);
        } finally {
            setSavingPassword(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('error', 'File harus berupa gambar');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('error', 'Ukuran file maksimal 2MB');
            return;
        }

        setUploadingAvatar(true);
        try {
            await ApiService.uploadAvatar(user.id, file);
            showToast('success', 'Foto profil berhasil diperbarui');
            refreshUser?.();
        } catch (err) {
            showToast('error', 'Gagal mengupload foto');
            console.error(err);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!user) return;

        setUploadingAvatar(true);
        try {
            await ApiService.deleteAvatar(user.id);
            showToast('success', 'Foto profil berhasil dihapus');
            refreshUser?.();
        } catch (err) {
            showToast('error', 'Gagal menghapus foto profil');
            console.error(err);
        } finally {
            setUploadingAvatar(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 px-4 w-full overflow-hidden">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    <User className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
            </div>

            {/* Avatar Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    <div className="relative">
                        <div
                            className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden cursor-pointer ring-4 ring-white shadow-lg"
                            onClick={handleAvatarClick}
                        >
                            {user?.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                user?.full_name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 flex gap-1">
                            {user?.avatar_url && (
                                <button
                                    onClick={handleDeleteAvatar}
                                    disabled={uploadingAvatar}
                                    className="p-1.5 bg-white rounded-full shadow-md border border-gray-100 hover:bg-red-50 text-red-500 transition-colors z-10"
                                    title="Hapus Foto"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button
                                onClick={handleAvatarClick}
                                disabled={uploadingAvatar}
                                className="p-1.5 bg-white rounded-full shadow-md border border-gray-100 hover:bg-gray-50 text-gray-600 transition-colors z-10"
                                title="Ganti Foto"
                            >
                                <Camera className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 break-all">{user?.full_name}</h2>
                        <p className="text-gray-500 break-all">@{user?.username}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize mt-2">
                            {user?.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Informasi Akun</h3>

                {/* Username (Read-only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <input
                            type="text"
                            value={user?.username || ''}
                            disabled
                            className="w-full sm:flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed min-w-0"
                        />
                        <span className="text-xs text-gray-400">Tidak dapat diubah</span>
                    </div>
                </div>

                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={!isEditingName}
                            className={`w-full sm:flex-1 px-4 py-2.5 border rounded-lg transition-colors ${isEditingName
                                ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                : 'bg-gray-50 border-gray-200'
                                }`}
                        />
                        {isEditingName ? (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleSaveName}
                                    disabled={savingName}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {savingName ? 'Menyimpan...' : 'Simpan'}
                                </button>
                                <button
                                    onClick={() => {
                                        setFullName(user?.full_name || '');
                                        setIsEditingName(false);
                                    }}
                                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
                                >
                                    Batal
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="w-full sm:w-auto px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!isEditingEmail}
                            className={`w-full sm:flex-1 px-4 py-2.5 border rounded-lg transition-colors ${isEditingEmail
                                ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                : 'bg-gray-50 border-gray-200'
                                }`}
                        />
                        {isEditingEmail ? (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={handleSaveEmail}
                                    disabled={savingEmail}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {savingEmail ? 'Menyimpan...' : 'Simpan'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEmail(user?.email || '');
                                        setIsEditingEmail(false);
                                    }}
                                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
                                >
                                    Batal
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditingEmail(true)}
                                className="w-full sm:w-auto px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                    {isEditingEmail && (
                        <p className="text-xs text-gray-500 mt-1">
                            Perubahan email memerlukan verifikasi ke email baru
                        </p>
                    )}
                </div>

            </div>

            {/* Change Password Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Keamanan
                    </h3>
                    {!showPasswordForm && (
                        <button
                            onClick={() => setShowPasswordForm(true)}
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            Ganti Password
                        </button>
                    )}
                </div>

                {showPasswordForm && (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
                            <div className="relative">
                                <input
                                    type={showOldPassword ? 'text' : 'password'}
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Masukkan password lama"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={MIN_PASSWORD_LENGTH}
                                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`Minimal ${MIN_PASSWORD_LENGTH} karakter`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ulangi password baru"
                            />
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordForm(false);
                                    setOldPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }}
                                className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={savingPassword}
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {savingPassword ? 'Menyimpan...' : 'Simpan Password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
