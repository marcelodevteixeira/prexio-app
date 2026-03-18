-- Author: Marcelo Teixeira
-- Prexio Database Optimizations

-- ==========================================
-- indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_prices_product_id ON public.prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_market_id ON public.prices(market_id);
CREATE INDEX IF NOT EXISTS idx_prices_created_at ON public.prices(created_at);
CREATE INDEX IF NOT EXISTS idx_prices_product_market ON public.prices(product_id, market_id);

-- ==========================================
-- price history table
-- ==========================================

CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on price_history if not already enabled
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- promotion queries
-- ==========================================

-- Below are the raw SQL queries that the application can use to calculate promotion data.
-- I have also created a convenient VIEW to make this easier to query directly from Supabase.

/*
-- 1. Average price of a product in the last 30 days
SELECT AVG(price) as avg_price_30d
FROM public.price_history
WHERE product_id = 'YOUR_PRODUCT_UUID'
  AND recorded_at >= NOW() - INTERVAL '30 days';

-- 2. Latest recorded price
SELECT price as latest_price, recorded_at
FROM public.price_history
WHERE product_id = 'YOUR_PRODUCT_UUID'
ORDER BY recorded_at DESC
LIMIT 1;

-- 3. Price variation percentage
WITH stats AS (
  SELECT
    (SELECT price FROM public.price_history WHERE product_id = 'YOUR_PRODUCT_UUID' ORDER BY recorded_at DESC LIMIT 1) as current_price,
    (SELECT AVG(price) FROM public.price_history WHERE product_id = 'YOUR_PRODUCT_UUID' AND recorded_at >= NOW() - INTERVAL '30 days') as avg_price
)
SELECT
  current_price,
  avg_price,
  CASE
    WHEN avg_price > 0 THEN ((current_price - avg_price) / avg_price) * 100
    ELSE 0
  END as variation_percentage
FROM stats;
*/

-- Convenient View for Promotion Detection
CREATE OR REPLACE VIEW public.promotion_stats AS
WITH recent_avg AS (
    SELECT
        product_id,
        AVG(price) AS avg_price_30d
    FROM public.price_history
    WHERE recorded_at >= NOW() - INTERVAL '30 days'
    GROUP BY product_id
),
latest_price AS (
    SELECT DISTINCT ON (product_id)
        product_id,
        price AS current_price,
        recorded_at AS last_recorded_at
    FROM public.price_history
    ORDER BY product_id, recorded_at DESC
)
SELECT
    l.product_id,
    l.current_price,
    a.avg_price_30d,
    CASE
        WHEN a.avg_price_30d > 0 THEN ((l.current_price - a.avg_price_30d) / a.avg_price_30d) * 100
        ELSE 0
    END AS variation_percentage
FROM latest_price l
LEFT JOIN recent_avg a ON l.product_id = a.product_id;


-- ==========================================
-- materialized view
-- ==========================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.product_best_prices AS
SELECT
    product_id,
    market_id,
    MIN(price) AS lowest_price
FROM public.prices
GROUP BY product_id, market_id;

-- Create a unique index on the materialized view to allow concurrent refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_best_prices_unique ON public.product_best_prices(product_id, market_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_product_best_prices()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_best_prices;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically refresh the view when a new price is added, updated, or deleted
DROP TRIGGER IF EXISTS refresh_best_prices_trigger ON public.prices;
CREATE TRIGGER refresh_best_prices_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.prices
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_product_best_prices();
