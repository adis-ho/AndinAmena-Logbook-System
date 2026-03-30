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
        setError('');
        setLoading(true);

        try {
            const success = await login(email, password);
            if (success) {
                // Fetch current user to get role
                const currentUser = await ApiService.getCurrentUser();
                if (currentUser) {
                    // Redirect based on role
                    if (currentUser.role === 'admin') {
                        navigate('/admin');
                    } else {
                        navigate('/driver');
                    }
                }
            } else {
                setError('Email atau password salah');
                setLoading(false);
            }
        } catch (err) {
            // Check if error is INACTIVE_USER
            if (err instanceof Error && err.message === 'INACTIVE_USER') {
                setError('Akun Anda telah dinonaktifkan. Hubungi admin untuk bantuan.');
            } else {
                setError('Terjadi kesalahan saat login. Periksa koneksi internet.');
            }
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6">
            <div className="max-w-md w-full">
                {/* Form Card */}
                <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] border border-gray-100">

                    {/* Logo Section — inside the card */}
                    <div className="flex justify-center items-center gap-4 mb-10">
                        <img src={logoAndin} alt="Andin Logo" className="h-10 sm:h-12 w-auto object-contain" />
                        <div className="h-1.5 w-1.5 bg-gray-300 rounded-full" aria-hidden="true"></div>
                        <img src={logoAss} alt="ASS Logo" className="h-10 sm:h-12 w-auto object-contain" />
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl sm:text-[1.75rem] font-black text-gray-900 tracking-tight leading-tight">Laporan Harian</h1>
                        <p className="mt-2 text-sm font-medium text-gray-500">Masuk untuk melanjutkan</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="sr-only">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        spellCheck={false}
                                        required
                                        className="appearance-none block w-full pl-[2.75rem] pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 font-medium text-sm focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10 focus-visible:border-blue-600 transition-all duration-300"
                                        placeholder="nama@email.com…"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300" aria-hidden="true" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        className="appearance-none block w-full pl-[2.75rem] pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 font-medium text-sm focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10 focus-visible:border-blue-600 transition-all duration-300"
                                        placeholder="Password…"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                                        <button
                                            type="button"
                                            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                            aria-pressed={showPassword}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" aria-hidden="true" />
                                            ) : (
                                                <Eye className="h-5 w-5" aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Region */}
                        <div aria-live="polite" aria-atomic="true">
                            {error && (
                                <div className="text-rose-600 text-[13px] font-medium flex items-start gap-2 bg-rose-50/80 border border-rose-100 px-3.5 py-3 rounded-xl transition-all duration-300">
                                    <span aria-hidden="true" className="text-xl leading-none">&bull;</span>
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Memproses…</span>
                                </div>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>
                </div>

                    {/* Privacy Policy Link */}
                    <p className="mt-6 text-center text-xs text-gray-400">
                        Dengan masuk, Anda menyetujui{' '}
                        <Link to="/privacy" className="text-blue-500 hover:text-blue-600 underline underline-offset-2 transition-colors">
                            Kebijakan Privasi
                        </Link>
                    </p>
            </div>
        </main>
    );
}
