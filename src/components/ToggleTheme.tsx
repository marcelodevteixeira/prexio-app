import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { motion } from 'motion/react';

export function ToggleTheme() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-white/10 dark:bg-zinc-800/50 backdrop-blur-md border border-white/20 dark:border-zinc-700/50 text-gray-700 dark:text-zinc-300 hover:bg-white/20 dark:hover:bg-zinc-700 transition-all"
      title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'light' ? 0 : 180 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </motion.div>
    </button>
  );
}
