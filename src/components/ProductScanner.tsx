import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Barcode, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductScannerProps {
  onClose: () => void;
  user: any;
  userProfile: any;
  notifyPoints: (points: number, reason: string) => void;
}

export function ProductScanner({ onClose, notifyPoints }: ProductScannerProps) {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const simulateScan = () => {
    setScanning(false);
    // Simulate a successful scan after 2 seconds
    setTimeout(() => {
      setResult('success');
      notifyPoints(10, 'Produto escaneado com sucesso!');
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 2000);
  };

  React.useEffect(() => {
    simulateScan();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
      >
        <div className="p-4 flex justify-between items-center border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Barcode className="w-5 h-5 text-blue-400" />
            Escanear Produto
          </h3>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-[3/4] bg-black flex items-center justify-center overflow-hidden">
          {scanning ? (
            <>
              <div className="absolute inset-0 border-2 border-blue-500/30 m-8 rounded-3xl" />
              <motion.div 
                className="absolute left-8 right-8 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute bottom-8 text-center w-full text-slate-400 text-sm font-medium px-4">
                Aponte a câmera para o código de barras do produto
              </div>
            </>
          ) : result === 'success' ? (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center p-6"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Produto Encontrado!</h4>
              <p className="text-slate-400">Leite Integral 1L - R$ 4,89</p>
            </motion.div>
          ) : result === 'error' ? (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center p-6"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Produto não encontrado</h4>
              <p className="text-slate-400 mb-6">Tente escanear novamente ou digite o código manualmente.</p>
              <button 
                onClick={() => { setScanning(true); setResult(null); simulateScan(); }}
                className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </motion.div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
