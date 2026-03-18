import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/lib/supabaseClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { product_id, market_id, city, price, user_id } = req.body;

    const { data, error } = await supabase
      .from('prices')
      .insert([{ product_id, market_id, city, price, user_id }])
      .select();

    if (error) throw error;

    return res.status(201).json(data[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
