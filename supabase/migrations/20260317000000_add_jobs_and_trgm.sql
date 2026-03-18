-- Create jobs table for background processing
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index for faster product matching
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
ON public.products
USING gin (name gin_trgm_ops);

-- Set up RLS for jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert jobs and read their own jobs
-- Assuming payload contains user_id if needed, or we just allow all authenticated for now
CREATE POLICY "Allow authenticated users to insert jobs"
ON public.jobs FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read jobs"
ON public.jobs FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow worker to update jobs"
ON public.jobs FOR UPDATE
TO authenticated, anon
USING (true);
