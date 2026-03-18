-- Author: Marcelo Teixeira
-- Prexio Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLES
-- ==========================================

-- 1. Users Table (Extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Markets Table
CREATE TABLE public.markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT NOT NULL,
    state TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Prices Table (Current/Latest Prices)
CREATE TABLE public.prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    is_promotion BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Shopping Lists Table
CREATE TABLE public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, completed, archived
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Shopping List Items Table
CREATE TABLE public.shopping_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    custom_name TEXT, -- In case product_id is null and user typed a custom item
    quantity NUMERIC(10, 3) DEFAULT 1,
    checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Purchases (Purchase History)
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    receipt_url TEXT,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Purchase Items Table
CREATE TABLE public.purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity NUMERIC(10, 3) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Price History Table (For tracking changes over time)
CREATE TABLE public.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Missions Table (Gamification)
CREATE TABLE public.missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    points_reward INTEGER NOT NULL DEFAULT 0,
    mission_type TEXT NOT NULL, -- e.g., 'scan_receipt', 'add_price'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. User Points Table
CREATE TABLE public.user_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLICIES
-- ==========================================

-- Users
CREATE POLICY "Users can read their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Markets (Public read)
CREATE POLICY "Anyone can read markets" ON public.markets FOR SELECT USING (true);

-- Products (Public read, authenticated insert)
CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Prices (Public read, authenticated insert)
CREATE POLICY "Anyone can read prices" ON public.prices FOR SELECT USING (true);
CREATE POLICY "Users can insert prices" ON public.prices FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shopping Lists (Owner only)
CREATE POLICY "Users can read own shopping lists" ON public.shopping_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shopping lists" ON public.shopping_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shopping lists" ON public.shopping_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shopping lists" ON public.shopping_lists FOR DELETE USING (auth.uid() = user_id);

-- Shopping List Items (Owner only via join)
CREATE POLICY "Users can manage own shopping list items" ON public.shopping_list_items 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists 
            WHERE shopping_lists.id = shopping_list_items.list_id 
            AND shopping_lists.user_id = auth.uid()
        )
    );

-- Purchases (Owner only)
CREATE POLICY "Users can read own purchases" ON public.purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Purchase Items (Owner only via join)
CREATE POLICY "Users can manage own purchase items" ON public.purchase_items 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.purchases 
            WHERE purchases.id = purchase_items.purchase_id 
            AND purchases.user_id = auth.uid()
        )
    );

-- Price History (Public read, authenticated insert)
CREATE POLICY "Anyone can read price history" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert price history" ON public.price_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Missions (Public read)
CREATE POLICY "Anyone can read missions" ON public.missions FOR SELECT USING (true);

-- User Points (Owner only)
CREATE POLICY "Users can read own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_markets_modtime BEFORE UPDATE ON public.markets FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_shopping_lists_modtime BEFORE UPDATE ON public.shopping_lists FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_shopping_list_items_modtime BEFORE UPDATE ON public.shopping_list_items FOR EACH ROW EXECUTE FUNCTION update_modified_column();
