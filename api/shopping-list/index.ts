import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/lib/supabaseClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { user_id, name, items } = req.body;

    const { data: listData, error: listError } = await supabase
      .from('shopping_lists')
      .insert([{ user_id, name }])
      .select()
      .single();

    if (listError) throw listError;

    if (items && items.length > 0) {
      const listItems = items.map((item: any) => ({
        list_id: listData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        checked: item.checked || false,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('shopping_list_items')
        .insert(listItems);

      if (itemsError) throw itemsError;
    }

    return res.status(201).json(listData);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
