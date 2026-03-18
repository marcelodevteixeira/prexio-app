import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, List, Database, User, LogOut, Trophy, Radar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/utils';
import { ToggleTheme } from './ToggleTheme';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'lists' | 'database' | 'economy' | 'profile' | 'radar';
  setActiveTab: (tab: 'lists' | 'database' | 'economy' | 'profile' | 'radar') => void;
  user: any;
}

export default function Layout({ children, activeTab, setActiveTab, user }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Prexio</h1>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => supabase.auth.signOut()}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pb-32 pt-6 px-6 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 px-8 py-4 pb-8 flex justify-around items-center z-50">
        <NavButton
          active={activeTab === 'lists'}
          onClick={() => setActiveTab('lists')}
          icon={<List className="w-6 h-6" />}
          label="Listas"
        />
        <NavButton
          active={activeTab === 'database'}
          onClick={() => setActiveTab('database')}
          icon={<Database className="w-6 h-6" />}
          label="Preços"
        />
        <NavButton
          active={activeTab === 'radar'}
          onClick={() => setActiveTab('radar')}
          icon={<Radar className="w-6 h-6" />}
          label="Radar"
        />
        <NavButton
          active={activeTab === 'economy'}
          onClick={() => setActiveTab('economy')}
          icon={<Trophy className="w-6 h-6" />}
          label="Missão"
        />
        <NavButton
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
          icon={<User className="w-6 h-6" />}
          label="Perfil"
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-blue-500 scale-110" : "text-slate-500 hover:text-slate-300"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-widest">{label}</span>
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="w-1 h-1 bg-blue-500 rounded-full mt-1"
        />
      )}
    </button>
  );
}
