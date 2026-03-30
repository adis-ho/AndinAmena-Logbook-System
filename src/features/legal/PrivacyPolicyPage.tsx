import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
                        aria-label="Kembali"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Kebijakan Privasi</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="prose prose-gray max-w-none">

                    <p className="text-sm text-gray-500 mb-8">
                        Terakhir diperbarui: 30 Maret 2026
                    </p>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Informasi yang Kami Kumpulkan</h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            Sistem Laporan Harian Andin-Amena mengumpulkan informasi berikut untuk keperluan operasional:
                        </p>
                        <ul className="list-disc pl-5 text-gray-600 space-y-1.5">
                            <li>Nama lengkap dan alamat email untuk autentikasi akun</li>
                            <li>Data perjalanan harian (rute, jarak tempuh, tujuan)</li>
                            <li>Informasi kendaraan dan unit operasional</li>
                            <li>Data transaksi e-toll</li>
                            <li>Catatan biaya operasional</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Penggunaan Informasi</h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            Informasi yang dikumpulkan digunakan untuk:
                        </p>
                        <ul className="list-disc pl-5 text-gray-600 space-y-1.5">
                            <li>Pencatatan dan pelaporan perjalanan harian driver</li>
                            <li>Monitoring operasional kendaraan oleh admin</li>
                            <li>Pembuatan laporan bulanan dan ringkasan driver</li>
                            <li>Pengelolaan transaksi e-toll dan biaya operasional</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Penyimpanan Data</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Data disimpan di server Supabase dengan enkripsi dan perlindungan Row Level Security (RLS).
                            Setiap pengguna hanya dapat mengakses data sesuai peran dan izin yang ditetapkan oleh administrator.
                            Password disimpan dalam bentuk hash dan tidak pernah disimpan dalam bentuk teks biasa.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Keamanan Data</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Kami menerapkan langkah-langkah keamanan berikut:
                        </p>
                        <ul className="list-disc pl-5 text-gray-600 space-y-1.5 mt-3">
                            <li>Enkripsi HTTPS untuk semua transmisi data</li>
                            <li>Row Level Security (RLS) pada database</li>
                            <li>Autentikasi berbasis JWT token</li>
                            <li>Pemisahan peran admin dan driver</li>
                            <li>Security headers (CSP, X-Frame-Options, HSTS)</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">5. Hak Pengguna</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Pengguna memiliki hak untuk:
                        </p>
                        <ul className="list-disc pl-5 text-gray-600 space-y-1.5 mt-3">
                            <li>Mengakses data logbook pribadi</li>
                            <li>Memperbarui informasi profil</li>
                            <li>Menghapus logbook yang ditolak</li>
                            <li>Meminta penghapusan akun kepada administrator</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">6. Berbagi Data</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Kami tidak menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga.
                            Data hanya diakses oleh administrator yang berwenang dalam sistem untuk keperluan operasional perusahaan.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">7. Perubahan Kebijakan</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Kebijakan privasi ini dapat diperbarui sewaktu-waktu. Perubahan akan berlaku segera setelah
                            dipublikasikan di halaman ini. Kami menyarankan pengguna untuk memeriksa halaman ini secara berkala.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-3">8. Kontak</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi administrator sistem
                            melalui fitur notifikasi dalam aplikasi.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
