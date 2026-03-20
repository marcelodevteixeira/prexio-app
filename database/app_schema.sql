-- Prexio App Schema (Matches App.tsx exactly)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    points_total INTEGER DEFAULT 0,
    level TEXT DEFAULT 'Iniciante',
    city TEXT,
    radar_enabled BOOLEAN DEFAULT FALSE,
    radar_max_distance INTEGER DEFAULT 10,
    radar_categories JSONB DEFAULT '[]'::jsonb,
    favorite_items JSONB DEFAULT '[]'::jsonb,
    item_frequencies JSONB DEFAULT '{}'::jsonb,
    share_anonymized_data BOOLEAN DEFAULT TRUE
);

-- Ensure columns exist if table was already created by old schema
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.users ADD COLUMN display_name TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.users ADD COLUMN photo_url TEXT;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.users ADD COLUMN points_total INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.users ADD COLUMN level TEXT DEFAULT 'Iniciante';
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.users ADD COLUMN radar_enabled BOOLEAN DEFAULT FALSE;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.users ADD COLUMN radar_max_distance INTEGER DEFAULT 10;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.users ADD COLUMN radar_categories JSONB DEFAULT '[]'::jsonb;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.users ADD COLUMN favorite_items JSONB DEFAULT '[]'::jsonb;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.users ADD COLUMN item_frequencies JSONB DEFAULT '{}'::jsonb;
    EXCEPTION WHEN duplicate_column THEN END;
    BEGIN
        ALTER TABLE public.users ADD COLUMN share_anonymized_data BOOLEAN DEFAULT TRUE;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 2. Lists Table
CREATE TABLE IF NOT EXISTS public.lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    item_count INTEGER DEFAULT 0,
    estimated_total NUMERIC(10, 2) DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE
);

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lists') THEN
        BEGIN ALTER TABLE public.lists ADD COLUMN item_count INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE public.lists ADD COLUMN estimated_total NUMERIC(10, 2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE public.lists ADD COLUMN completed BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN END;
    END IF;
END $$;

-- 3. List Items Table
CREATE TABLE IF NOT EXISTS public.list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
    product_id TEXT,
    name TEXT NOT NULL,
    quantity NUMERIC(10, 3) DEFAULT 1,
    price NUMERIC(10, 2) DEFAULT 0,
    is_bought BOOLEAN DEFAULT FALSE,
    wholesale_price NUMERIC(10, 2),
    wholesale_min_qty NUMERIC(10, 3),
    ean TEXT,
    savings_applied NUMERIC(10, 2) DEFAULT 0
);

DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'list_items') THEN
        BEGIN ALTER TABLE public.list_items ADD COLUMN product_id TEXT; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE public.list_items ADD COLUMN wholesale_price NUMERIC(10, 2); EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE public.list_items ADD COLUMN wholesale_min_qty NUMERIC(10, 3); EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE public.list_items ADD COLUMN ean TEXT; EXCEPTION WHEN duplicate_column THEN END;
        BEGIN ALTER TABLE public.list_items ADD COLUMN savings_applied NUMERIC(10, 2) DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    END IF;
END $$;

-- 4. Prices Table
DO $$ 
BEGIN
    -- If prices table exists and product_id is UUID, rename it to prices_old
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prices' AND column_name = 'product_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.prices RENAME TO prices_old;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    market TEXT NOT NULL,
    city TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT NOT NULL
);

-- 5. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    ean TEXT UNIQUE
);

DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.products ADD COLUMN ean TEXT UNIQUE;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 6. Missions Table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'missions' AND column_name = 'mission_type'
    ) THEN
        ALTER TABLE public.missions RENAME TO missions_old;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    goal INTEGER NOT NULL,
    reward_points INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL
);

DO $$ 
BEGIN
    BEGIN ALTER TABLE public.missions ADD COLUMN goal INTEGER DEFAULT 1; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.missions ADD COLUMN reward_points INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.missions ADD COLUMN type TEXT DEFAULT 'general'; EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 7. User Missions Table
CREATE TABLE IF NOT EXISTS public.user_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Badges Table
CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT
);

-- 9. User Badges Table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    date_earned TIMESTAMPTZ DEFAULT NOW()
);

-- 10. User Notifications Table
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    promotion_id TEXT,
    title TEXT NOT NULL,
    body TEXT,
    sent BOOLEAN DEFAULT FALSE,
    opened BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. User Tracked Products Table
CREATE TABLE IF NOT EXISTS public.user_tracked_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT
);

-- Disable RLS for easy testing (or enable and add policies if needed)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tracked_products DISABLE ROW LEVEL SECURITY;

-- Insert default badges and missions
INSERT INTO public.badges (id, name, description, icon) VALUES
('b1', 'Iniciante', 'Ganhou seus primeiros 100 pontos', 'award'),
('b2', 'Explorador', 'Atingiu 1000 pontos', 'map'),
('b3', 'Mestre', 'Atingiu 5000 pontos', 'trophy')
ON CONFLICT (id) DO NOTHING;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Escanear 3 notas fiscais') THEN
        EXECUTE 'INSERT INTO public.missions (title, description, goal, reward_points, type) VALUES (''Escanear 3 notas fiscais'', ''Contribua com dados de compras reais'', 3, 50, ''receipt'')';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Registrar 10 preços') THEN
        EXECUTE 'INSERT INTO public.missions (title, description, goal, reward_points, type) VALUES (''Registrar 10 preços'', ''Ajude a comunidade a encontrar o melhor preço'', 10, 100, ''price'')';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.missions WHERE title = 'Encontrar 3 promoções') THEN
        EXECUTE 'INSERT INTO public.missions (title, description, goal, reward_points, type) VALUES (''Encontrar 3 promoções'', ''Registre preços mais baratos que o atual'', 3, 80, ''promotion'')';
    END IF;
END $$;
