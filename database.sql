-- PERINTAH SQL UNTUK SUPABASE (AKSICEPAT+) - VERSI IDEMPOTENT (Bisa dijalankan berulang kali)
-- Jalankan ini di SQL Editor Supabase Anda.

-- 1. Tabel Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT CHECK (role IN ('ADMIN', 'USER')) DEFAULT 'USER',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid errors
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles." ON profiles;

-- Create Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profiles." ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Tabel Guides (Panduan Medis)
CREATE TABLE IF NOT EXISTS guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    steps JSONB NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guides are viewable by everyone." ON guides;
DROP POLICY IF EXISTS "Only admins can modify guides." ON guides;

CREATE POLICY "Guides are viewable by everyone." ON guides
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify guides." ON guides
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );

-- 3. Tabel Facilities (Fasilitas Kesehatan)
CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    type TEXT CHECK (type IN ('RS', 'Klinik')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Facilities are viewable by everyone." ON facilities;
DROP POLICY IF EXISTS "Only admins can modify facilities." ON facilities;

CREATE POLICY "Facilities are viewable by everyone." ON facilities
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify facilities." ON facilities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );

-- 4. Tabel Emergency Logs
CREATE TABLE IF NOT EXISTS emergency_logs (
    id BIGSERIAL PRIMARY KEY,
    category TEXT,
    user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE emergency_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view all logs." ON emergency_logs;
DROP POLICY IF EXISTS "Authenticated users can insert logs." ON emergency_logs;

CREATE POLICY "Admin can view all logs." ON emergency_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );

CREATE POLICY "Authenticated users can insert logs." ON emergency_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. FUNCTION & TRIGGER: Auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name',
    CASE WHEN (SELECT count(*) FROM public.profiles) = 0 THEN 'ADMIN' ELSE 'USER' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- INSERT INITIAL MOCK DATA (Gunakan ON CONFLICT agar tidak double)
INSERT INTO facilities (name, address, phone, type) 
VALUES ('RS Medika Utama', 'Jl. Kesehatan No. 123, Jakarta', '021-555-1234', 'RS')
ON CONFLICT DO NOTHING;
