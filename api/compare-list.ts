import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../src/lib/supabaseClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { items, city } = req.body;

    const { data: markets, error: marketsError } = await supabase
      .from('markets')
      .select('id, name')
      .eq('city', city);

    if (marketsError) throw marketsError;

    const marketTotals: Record<string, { marketId: string, marketName: string, total: number, items: any[] }> = {};

    for (const market of markets) {
      marketTotals[market.id] = {
        marketId: market.id,
        marketName: market.name,
        total: 0,
        items: []
      };
    }

    for (const item of items) {
      const { data: prices, error: pricesError } = await supabase
        .from('prices')
        .select('market_id, price')
        .eq('product_id', item.product_id)
        .eq('city', city)
        .order('created_at', { ascending: false });

      if (pricesError) continue;

      const latestPrices: Record<string, number> = {};
      for (const p of prices) {
        if (!latestPrices[p.market_id]) {
          latestPrices[p.market_id] = p.price;
        }
      }

      for (const market of markets) {
        const price = latestPrices[market.id] || 0;
        marketTotals[market.id].items.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price,
          found: price > 0
        });
        marketTotals[market.id].total += price * item.quantity;
      }
    }

    const rankings = Object.values(marketTotals).sort((a, b) => a.total - b.total);
    
    let savings = 0;
    if (rankings.length > 1) {
      savings = rankings[rankings.length - 1].total - rankings[0].total;
    }

    return res.status(200).json({ rankings, savings });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
