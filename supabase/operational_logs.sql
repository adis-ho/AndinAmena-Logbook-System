-- Membuat tabel untuk melacak perubahan saldo (History Logs)
CREATE TABLE IF NOT EXISTS public.balance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Admin yang melakukan aksi
    action_type TEXT NOT NULL CHECK (action_type IN ('top_up', 'edit', 'reset')),
    amount NUMERIC, -- Jumlah yang ditambahkan/dikurangi/diset
    previous_balance NUMERIC NOT NULL, -- Saldo sebelum perubahan
    new_balance NUMERIC NOT NULL, -- Saldo setelah perubahan
    description TEXT, -- Deskripsi tambahan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mengaktifkan RLS (Row Level Security)
ALTER TABLE public.balance_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses (Policies)

-- Admin bisa melihat semua log saldo
CREATE POLICY "Admin dapat melihat semua log saldo" ON public.balance_logs
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admin bisa memasukkan log saldo baru
CREATE POLICY "Admin dapat membuat log saldo" ON public.balance_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Driver bisa melihat log saldo mereka sendiri
CREATE POLICY "Driver dapat melihat log saldo sendiri" ON public.balance_logs
    FOR SELECT
    USING (auth.uid() = driver_id);
