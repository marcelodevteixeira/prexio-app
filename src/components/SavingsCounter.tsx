import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getUserSavings, UserSavings } from '@/services/savingsService';
import { formatCurrency } from '@/utils';
import { Wallet, TrendingUp, Calendar } from 'lucide-react';

interface Props {
  userId: string;
}

export function SavingsCounter({ userId }: Props) {
  const [savings, setSavings] = useState<UserSavings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSavings() {
      try {
        const data = await getUserSavings(userId);
        setSavings(data);
      } catch (error) {
        console.error("Error fetching savings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSavings();
  }, [userId]);

  if (loading) {
    return (
      <div className="animate-pulse bg-slate-900 rounded-3xl h-32 w-full border border-slate-800"></div>
    );
  }

  if (!savings) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-[32px] p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold">Economia com o App</h3>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">Economia total usando o app</p>
            <p className="text-4xl font-black text-emerald-400 drop-shadow-sm">
              {formatCurrency(savings.total_saved)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-100" />
                <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">Este Mês</p>
              </div>
              <p className="text-xl font-bold">{formatCurrency(savings.saved_this_month)}</p>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-100" />
                <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">Este Ano</p>
              </div>
              <p className="text-xl font-bold">{formatCurrency(savings.saved_this_year)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
