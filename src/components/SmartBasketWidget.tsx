import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, TrendingDown, Store, ArrowRight, Loader2 } from 'lucide-react';
import { calculateSmartBasketComparison, SmartBasketResult } from '@/services/smartBasketService';
import { formatCurrency } from '@/utils';

interface Props {
  userId: string;
  city: string;
}

export function SmartBasketWidget({ userId, city }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    rankings: SmartBasketResult[];
    savings: number;
    cheapestMarket: string;
    cheapestTotal: number;
  } | null>(null);

  useEffect(() => {
    async function fetchSmartBasket() {
      setLoading(true);
      try {
        const result = await calculateSmartBasketComparison(userId, city);
        setData(result);
      } catch (error) {
        console.error("Error fetching smart basket:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (userId && city) {
      fetchSmartBasket();
    }
  }, [userId, city]);

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-[32px] p-6 border border-slate-800 shadow-sm flex items-center justify-center min-h-[160px]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!data || data.rankings.length < 2) {
    return null; // Don't show if not enough data
  }

  const { cheapestMarket, cheapestTotal, savings, rankings } = data;
  const isSignificantSavings = savings > (cheapestTotal * 0.1); // > 10% savings

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-[32px] p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <ShoppingBag className="w-24 h-24" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm uppercase tracking-widest">Compra Inteligente</h3>
        </div>

        <p className="text-blue-100 mb-1">Hoje sua cesta padrão está mais barata no</p>
        <h4 className="text-3xl font-black mb-4">{cheapestMarket}</h4>

        {isSignificantSavings && (
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-400 text-emerald-900 rounded-full">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-blue-100 text-xs font-medium uppercase tracking-widest">Economia Estimada</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(savings)}</p>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-6">
          {rankings.slice(0, 3).map((market, idx) => (
            <div key={market.market} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="opacity-70">{idx + 1}.</span>
                <span className="font-medium flex items-center gap-1">
                  {market.market}
                  {market.isSponsored && (
                    <span className="bg-emerald-400 text-emerald-900 text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm font-bold ml-1">
                      Patrocinado
                    </span>
                  )}
                </span>
              </div>
              <span className="font-bold">{formatCurrency(market.total)}</span>
            </div>
          ))}
        </div>

        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700">
          Ver Comparação Completa
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
