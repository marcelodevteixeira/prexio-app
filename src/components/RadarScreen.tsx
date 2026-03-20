import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Radar, MapPin, TrendingDown, Bell, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/utils';

interface RadarScreenProps {
  user: any;
  userProfile: any;
}

export default function RadarScreen({ user, userProfile }: RadarScreenProps) {
  const [trackedItems, setTrackedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrackedPrices() {
      if (!userProfile?.favoriteItems || userProfile.favoriteItems.length === 0) {
        setTrackedItems([]);
        setLoading(false);
        return;
      }

      try {
        const { data: prices, error } = await supabase
          .from('prices')
          .select('product_id, price, market')
          .in('product_id', userProfile.favoriteItems)
          .order('date', { ascending: false });

        if (error) throw error;

        const itemsWithBestPrice = userProfile.favoriteItems.map((itemName: string) => {
          const itemPrices = prices?.filter(p => p.product_id === itemName) || [];
          if (itemPrices.length > 0) {
            // Find the lowest price
            const bestPrice = itemPrices.reduce((min, p) => p.price < min.price ? p : min, itemPrices[0]);
            return {
              product: itemName,
              currentBest: bestPrice.price,
              market: bestPrice.market,
              hasPrice: true
            };
          }
          return {
            product: itemName,
            hasPrice: false
          };
        });

        setTrackedItems(itemsWithBestPrice);
      } catch (error) {
        console.error("Error fetching tracked prices:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrackedPrices();
  }, [userProfile?.favoriteItems]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white">Radar de Ofertas</h2>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-sm">
          <Radar className="w-6 h-6 text-blue-400" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-8 rounded-[32px] shadow-xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-6 h-6 text-blue-200" />
            <span className="font-semibold text-blue-100">
              {userProfile?.city || 'Sua Região'}
            </span>
          </div>
          <h3 className="text-2xl font-bold mb-2">Monitoramento Ativo</h3>
          <p className="text-blue-100 text-sm max-w-[250px]">
            Acompanhando os melhores preços para os seus produtos favoritos.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Seus Favoritos</h3>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-slate-400">Carregando preços...</div>
        ) : trackedItems.length === 0 ? (
          <div className="bg-slate-900 rounded-3xl p-6 text-center border border-slate-800">
            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-white mb-1">Nenhum item no radar</h3>
            <p className="text-sm text-slate-400">
              Adicione itens aos favoritos na sua lista de compras para monitorar os preços aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {trackedItems.map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.01 }}
                className="bg-slate-900 p-6 rounded-[24px] border border-slate-800 shadow-sm flex flex-col gap-4 transition-colors hover:border-slate-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{item.product}</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                        Monitorando
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400">
                    Ativo
                  </div>
                </div>

                {item.hasPrice ? (
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Melhor preço encontrado</p>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{formatCurrency(item.currentBest)}</span>
                        <span className="text-xs text-slate-400">em {item.market}</span>
                      </div>
                    </div>
                    <TrendingDown className="w-5 h-5 text-emerald-400" />
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500">Ainda não encontramos preços para este item na sua região.</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
