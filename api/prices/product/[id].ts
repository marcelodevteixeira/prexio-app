import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../src/lib/supabaseClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { id, city } = req.query;

    let query = supabase
      .from('prices')
      .select('*, markets(name)')
      .eq('product_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
