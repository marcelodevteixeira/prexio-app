import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'promotion' | 'alert' | 'system';
}

interface PromotionAlertProps {
  notifications: Notification[];
}

export function PromotionAlert({ notifications }: PromotionAlertProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setVisibleNotifications(notifications);
    }
  }, [notifications]);

  const removeNotification = (id: string) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto w-full max-w-sm bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-4 flex items-start gap-3"
          >
            <div className={cn(
              "p-2 rounded-xl",
              notification.type === 'promotion' ? "bg-emerald-500/10 text-emerald-400" :
              notification.type === 'alert' ? "bg-blue-500/10 text-blue-400" :
              "bg-slate-800 text-slate-400"
            )}>
              {notification.type === 'promotion' ? <TrendingDown className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <div className="flex-1 pt-1">
              <h4 className="font-bold text-white text-sm">{notification.title}</h4>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{notification.message}</p>
            </div>
            <button 
              onClick={() => removeNotification(notification.id)}
              className="p-1 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
