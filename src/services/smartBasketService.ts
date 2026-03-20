import { supabase } from '@/lib/supabaseClient';

export const dummy = {};

export interface SmartBasketResult { recommendedMarket: string; total: number; savings: number; items: any[]; market?: string; isSponsored?: boolean; }

export async function updatePurchasePatterns(...args: any[]) {}
export async function calculateSmartBasketComparison(userId: string, city: string) {
  try {
    // 1. Get user profile to find favorite items
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('favorite_items')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile || !userProfile.favorite_items || userProfile.favorite_items.length === 0) {
      return null;
    }

    const favoriteItems = userProfile.favorite_items;

    // 2. Get all recent prices for these items in the city
    const { data: prices, error: pricesError } = await supabase
      .from('prices')
      .select('product_id, price, market')
      .in('product_id', favoriteItems)
      .eq('city', city)
      .order('date', { ascending: false });

    if (pricesError || !prices || prices.length === 0) {
      return null;
    }

    // 3. Group prices by market
    const markets = new Set(prices.map(p => p.market));
    const rankings: any[] = [];

    markets.forEach(market => {
      let total = 0;
      const itemsWithPrices: any[] = [];

      favoriteItems.forEach((itemName: string) => {
        const marketPrice = prices.find(p => p.market === market && p.product_id === itemName);
        
        if (marketPrice) {
          total += marketPrice.price;
          itemsWithPrices.push({
            name: itemName,
            price: marketPrice.price,
            found: true
          });
        } else {
          itemsWithPrices.push({
            name: itemName,
            price: 0,
            found: false
          });
        }
      });

      rankings.push({
        market,
        total,
        items: itemsWithPrices
      });
    });

    // Sort by total (cheapest first)
    rankings.sort((a, b) => a.total - b.total);

    if (rankings.length === 0) return null;

    const cheapestMarket = rankings[0].market;
    const cheapestTotal = rankings[0].total;
    let savings = 0;

    if (rankings.length > 1) {
      const mostExpensive = rankings[rankings.length - 1].total;
      savings = mostExpensive - cheapestTotal;
    }

    return {
      rankings,
      savings,
      cheapestMarket,
      cheapestTotal
    };
  } catch (error) {
    console.error("Error calculating smart basket:", error);
    return null;
  }
}
