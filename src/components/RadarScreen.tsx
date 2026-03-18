import React from 'react';
import { motion } from 'motion/react';
import { Radar, MapPin, TrendingDown, Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RadarScreenProps {
  user: any;
  userProfile: any;
}

export default function RadarScreen({ user, userProfile }: RadarScreenProps) {
  const alerts = [
    {
      id: 1,
      product: 'Leite Integral 1L',
      targetPrice: 4.50,
      currentBest: 4.89,
      market: 'Carrefour',
      active: true,
    },
    {
      id: 2,
      product: 'Café Torrado 500g',
      targetPrice: 12.00,
      currentBest: 14.50,
      market: 'Assaí',
      active: true,
    },
    {
      id: 3,
      product: 'Arroz Branco 5kg',
      targetPrice: 20.00,
      currentBest: 21.90,
      market: 'Atacadão',
      active: false,
    }
  ];

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
            Avisaremos quando seus produtos favoritos atingirem o preço desejado.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Seus Alertas</h3>
          <button className="text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors">
            + Novo Alerta
          </button>
        </div>
        
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              whileHover={{ scale: 1.01 }}
              className="bg-slate-900 p-6 rounded-[24px] border border-slate-800 shadow-sm flex flex-col gap-4 transition-colors hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    alert.active ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-500"
                  )}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{alert.product}</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
                      Alvo: R$ {alert.targetPrice.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                  alert.active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"
                )}>
                  {alert.active ? 'Ativo' : 'Pausado'}
                </div>
              </div>

              {alert.active && (
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Melhor preço atual</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">R$ {alert.currentBest.toFixed(2).replace('.', ',')}</span>
                      <span className="text-xs text-slate-400">em {alert.market}</span>
                    </div>
                  </div>
                  <TrendingDown className="w-5 h-5 text-emerald-400" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
