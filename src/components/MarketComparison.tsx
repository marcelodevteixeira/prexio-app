import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingList } from '@/lib/types';
import { calculateListCostByMarket, MarketComparisonResult } from '@/services/marketComparison';
import { Store, ChevronDown, ChevronUp, Share2, Loader2, AlertCircle, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils';

interface Props {
  list: ShoppingList;
}

import { useToast } from './Toast';

export function MarketComparison({ list }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{ rankings: MarketComparisonResult[], savings: number } | null>(null);
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);

  useEffect(() => {
    async function fetchComparison() {
      setLoading(true);
      try {
        const data = await calculateListCostByMarket(list.id);
        setResults(data);
      } catch (error) {
        console.error("Error fetching market comparison:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchComparison();
  }, [list.id]);

  const handleShare = async () => {
    if (!results || results.rankings.length < 2) return;
    
    const bestMarket = results.rankings[0];
    const savings = results.savings;
    
    const text = `Minha lista ficou ${formatCurrency(savings)} mais barata no ${bestMarket.market}.\nDescobri isso usando o app.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Economia na Lista de Compras',
          text,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      showToast('Mensagem copiada para a área de transferência!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium">Analisando preços nos mercados...</p>
      </div>
    );
  }

  if (!results || results.rankings.length === 0) {
    return (
      <div className="bg-slate-900 rounded-3xl p-6 text-center border border-slate-800">
        <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="font-bold text-white mb-1">Sem dados suficientes</h3>
        <p className="text-sm text-slate-400">
          Não encontramos preços registrados para os itens desta lista. Registre preços para habilitar a comparação.
        </p>
      </div>
    );
  }

  const bestMarket = results.rankings[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Comparação de Mercados</h3>
        </div>
        
        {results.savings > 0 && (
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">Economia possível</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(results.savings)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Rankings */}
      <div className="space-y-4">
        {results.rankings.map((market, index) => {
          // Find the actual cheapest (it might not be index 0 if index 0 is sponsored)
          const actualCheapest = [...results.rankings].sort((a, b) => a.total - b.total)[0];
          const isBest = market.market === actualCheapest.market;
          const isExpanded = expandedMarket === market.market;
          const missingItems = market.items.filter(i => !i.found).length;
          const isSponsored = (market as any).isSponsored;
          
          return (
            <motion.div 
              key={market.market}
              layout
              className={`bg-slate-900 rounded-3xl border overflow-hidden transition-all ${
                isBest ? 'border-emerald-500/50 shadow-md shadow-emerald-500/10' : isSponsored ? 'border-yellow-500/50 shadow-md shadow-yellow-500/10' : 'border-slate-800 shadow-sm'
              }`}
            >
              {isBest && (
                <div className="bg-emerald-500/10 px-4 py-2 flex items-center gap-2 border-b border-emerald-500/20">
                  <span className="text-lg">⭐</span>
                  <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Melhor Preço Real</span>
                </div>
              )}
              {isSponsored && !isBest && (
                <div className="bg-yellow-500/10 px-4 py-2 flex items-center gap-2 border-b border-yellow-500/20">
                  <span className="text-lg">🔥</span>
                  <span className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Patrocinado</span>
                </div>
              )}
              
              <div 
                className="p-5 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedMarket(isExpanded ? null : market.market)}
              >
                <div>
                  <h4 className="font-bold text-lg text-white">{market.market}</h4>
                  {missingItems > 0 && (
                    <p className="text-xs text-orange-400 font-medium mt-1">
                      Faltam {missingItems} ite{missingItems === 1 ? 'm' : 'ns'}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Total</p>
                    <p className={`text-xl font-bold ${isBest ? 'text-emerald-400' : 'text-white'}`}>
                      {formatCurrency(market.total)}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-800 bg-slate-800/30"
                  >
                    <div className="p-5 space-y-3">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detalhes dos itens</h5>
                      {market.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">{item.quantity}x</span>
                            <span className={item.found ? 'text-slate-300' : 'text-slate-600 line-through'}>
                              {item.name}
                            </span>
                          </div>
                          <span className={item.found ? 'font-semibold text-white' : 'text-orange-400 text-xs font-medium'}>
                            {item.found ? formatCurrency(item.price * item.quantity) : 'Sem preço'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Share Button */}
      {results.savings > 0 && (
        <button
          onClick={handleShare}
          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Share2 className="w-5 h-5" />
          Compartilhar Economia
        </button>
      )}
    </div>
  );
}
