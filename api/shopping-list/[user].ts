import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/lib/supabaseClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { user } = req.query;

    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*, shopping_list_items(*, products(*))')
      .eq('user_id', user)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
