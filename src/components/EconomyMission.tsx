import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, Target, Zap, Gift, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EconomyMissionProps {
  user: any;
}

export default function EconomyMission({ user }: EconomyMissionProps) {
  const missions = [
    {
      id: 1,
      title: 'Caçador de Ofertas',
      description: 'Adicione 5 produtos com preço menor que a média.',
      progress: 3,
      total: 5,
      reward: 50,
      icon: <Target className="w-6 h-6 text-blue-400" />,
      color: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 2,
      title: 'Scanner Mestre',
      description: 'Escaneie 10 notas fiscais (NFC-e) este mês.',
      progress: 10,
      total: 10,
      reward: 100,
      icon: <Zap className="w-6 h-6 text-emerald-400" />,
      color: 'bg-emerald-500/10 border-emerald-500/20',
      completed: true,
    },
    {
      id: 3,
      title: 'Comparador Frequente',
      description: 'Compare preços de 3 listas diferentes.',
      progress: 1,
      total: 3,
      reward: 30,
      icon: <Star className="w-6 h-6 text-purple-400" />,
      color: 'bg-purple-500/10 border-purple-500/20',
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white">Conquistas</h2>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
          <Trophy className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-white">{user?.pointsTotal || 0} pts</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[32px] border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-blue-500/20 rounded-2xl">
              <Gift className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Nível {user?.level || 'Iniciante'}</h3>
              <p className="text-slate-400 text-sm">Faltam 150 pontos para o próximo nível</p>
            </div>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3 mb-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-3 rounded-full" 
              style={{ width: '45%' }}
            />
          </div>
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>0 pts</span>
            <span>500 pts</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Missões Ativas</h3>
        
        <div className="grid gap-4">
          {missions.map((mission) => (
            <motion.div
              key={mission.id}
              whileHover={{ scale: 1.01 }}
              className={cn(
                "p-6 rounded-[24px] border shadow-sm relative overflow-hidden transition-colors",
                mission.completed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-900 border-slate-800 hover:border-slate-700"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("p-3 rounded-2xl border", mission.color)}>
                  {mission.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-white">{mission.title}</h4>
                    <span className="text-sm font-bold text-emerald-400">+{mission.reward} pts</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">{mission.description}</p>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-1000",
                          mission.completed ? "bg-emerald-400" : "bg-blue-500"
                        )}
                        style={{ width: `${(mission.progress / mission.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                      {mission.progress} / {mission.total}
                    </span>
                  </div>
                </div>
              </div>
              
              {mission.completed && (
                <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center backdrop-blur-[1px] opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <button className="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                    Resgatar Recompensa
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
