import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { ApiService } from '../../services/api';
import logoAndin from '../../assets/images/logo-andin.png';
import logoAss from '../../assets/images/logo-ass.png';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('[LoginPage] Attempting login for:', email);
            const success = await login(email, password);

            if (success) {
                console.log('[LoginPage] Login successful, redirecting...');

                // Try to get current user for role-based redirect
                try {
                    const currentUser = await ApiService.getCurrentUser();
                    console.log('[LoginPage] User role:', currentUser?.role);

                    if (currentUser?.role === 'admin') {
                        navigate('/admin');
                    } else {
                        navigate('/driver');
                    }
                } catch (profileErr) {
                    console.warn('[LoginPage] Could not fetch profile, defaulting to driver');
                    navigate('/driver');
                }
            } else {
                setError('Email atau password salah. Silakan coba lagi.');
                setLoading(false);
            }
        } catch (err) {
            console.error('[LoginPage] Login error:', err);
            // Handle inactive user error
            if (err instanceof Error && err.message === 'INACTIVE_USER') {
                setError('Akun Anda telah dinonaktifkan. Hubungi admin untuk bantuan.');
            } else {
                setError('Terjadi kesalahan saat login. Periksa koneksi internet.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <div className="flex justify-center items-center gap-4 mb-6">
                        <img src={logoAndin} alt="Andin Logo" className="h-12 w-auto object-contain" />
                        <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
                        <img src={logoAss} alt="ASS Logo" className="h-12 w-auto object-contain" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Laporan Harian</h2>
                    <p className="mt-2 text-sm text-gray-600">Masuk untuk melanjutkan</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none rounded-lg relative block w-full pl-10 pr-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
                        >
                            {loading ? 'Memproses...' : 'Masuk'}
                        </button>
                    </div>

                    <div className="text-center text-sm">
                        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                            Daftar sebagai Driver
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
