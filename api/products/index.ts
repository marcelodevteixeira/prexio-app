import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/lib/supabaseClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { barcode, name, brand, category, image_url } = req.body;

    const { data, error } = await supabase
      .from('products')
      .insert([{ barcode, name, brand, category, image_url }])
      .select();

    if (error) throw error;

    return res.status(201).json(data[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
