-- Membuat tabel untuk melacak perubahan saldo E-Toll (E-Toll History Logs)
CREATE TABLE IF NOT EXISTS public.etoll_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    etoll_id UUID REFERENCES public.etolls(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Admin yang melakukan aksi
    action_type TEXT NOT NULL CHECK (action_type IN ('top_up', 'deduct', 'edit', 'reset')),
    amount NUMERIC, -- Jumlah yang ditambahkan/dikurangi/diset
    previous_balance NUMERIC NOT NULL, -- Saldo sebelum perubahan
    new_balance NUMERIC NOT NULL, -- Saldo setelah perubahan
    description TEXT, -- Deskripsi tambahan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mengaktifkan RLS (Row Level Security)
ALTER TABLE public.etoll_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses (Policies)

-- Admin bisa melihat semua log etoll
CREATE POLICY "Admin dapat melihat semua log etoll" ON public.etoll_logs
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admin bisa memasukkan log etoll baru
CREATE POLICY "Admin dapat membuat log etoll" ON public.etoll_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Driver tidak butuh akses langsung ke etoll logs untuk saat ini
-- Tapi jika nanti butuh, bisa ditambahkan policy read log etoll yang terkait unit yang mereka bawa (complex)
