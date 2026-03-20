import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { createWorker } from 'tesseract.js';
import { Camera, X, Scan, Type, Barcode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScannerProps {
  onScanResult: (result: string, type: 'qr' | 'barcode' | 'ocr') => void;
  onClose: () => void;
  mode: 'qr' | 'barcode' | 'ocr';
}

import { useToast } from './Toast';

export default function Scanner({ onScanResult, onClose, mode }: ScannerProps) {
  const { showToast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log('Scanner mounted with mode:', mode);
    if (mode === 'qr' || mode === 'barcode') {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      const config = { 
        fps: 10, 
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdgePercentage = 0.7;
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        },
        aspectRatio: 1.0
      };

      const startScanner = (constraints: any) => {
        html5QrCode.start(
          constraints,
          config,
          (decodedText) => {
            onScanResult(decodedText, mode);
            html5QrCode.stop().then(onClose);
          },
          (errorMessage) => {
            // console.log(errorMessage);
          }
        ).catch(err => {
          console.error("Scanner start error:", err);
          // Fallback to any camera if environment camera is not found
          if (err.name === 'NotFoundError' && constraints.facingMode === 'environment') {
            console.log("Environment camera not found, falling back to any camera...");
            startScanner({ facingMode: "user" });
          } else if (err.name === 'NotFoundError') {
            showToast("Nenhuma câmera encontrada neste dispositivo.", 'error');
            onClose();
          }
        });
      };

      startScanner({ facingMode: "environment" });

      return () => {
        if (html5QrCode.isScanning) {
          html5QrCode.stop();
        }
      };
    } else if (mode === 'ocr') {
      // OCR logic using camera stream and Tesseract
      startCamera();
    }
  }, [mode]);

  const startCamera = async (constraints: any = { video: { facingMode: 'environment' } }) => {
    console.log('Starting camera with constraints:', constraints);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained');
      
      // Wait a tiny bit for the ref to be populated if it's not yet
      if (!videoRef.current) {
        console.log('Video ref not yet available, waiting...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        console.log('Video stream attached to ref');
      } else {
        console.error('Video ref still null after waiting');
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === 'NotFoundError' && constraints.video.facingMode === 'environment') {
        console.log("Environment camera not found for OCR, falling back to any camera...");
        startCamera({ video: true });
      } else {
        showToast("Não foi possível acessar a câmera. Verifique as permissões.", 'error');
        onClose();
      }
    }
  };

  const captureAndOCR = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');

    setIsScanning(false);
    setOcrProgress(0.1); // Show progress bar immediately
    
    try {
      const worker = await createWorker('por', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(m.progress);
          }
        }
      });

      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();

      // Try to find a price in the text (e.g., R$ 10,00 or 10.00)
      const priceMatch = text.match(/(\d+[,.]\d{2})/);
      if (priceMatch) {
        onScanResult(priceMatch[1].replace(',', '.'), 'ocr');
        onClose();
      } else {
        showToast("Preço não encontrado na imagem. Tente novamente ou digite manualmente.", 'error');
        setIsScanning(true);
        setOcrProgress(0);
      }
    } catch (error) {
      console.error("OCR Error:", error);
      showToast("Erro ao processar a imagem. Tente novamente.", 'error');
      setIsScanning(true);
      setOcrProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      <div className="absolute top-6 right-6 z-[110]">
        <button
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white backdrop-blur-md transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-md px-6 text-center mb-8">
        <h2 className="text-white text-xl font-semibold mb-2">
          {mode === 'qr' ? 'Escanear Nota Fiscal' : mode === 'barcode' ? 'Escanear Produto' : 'Escanear Preço'}
        </h2>
        <p className="text-white/60 text-sm">
          {mode === 'ocr' ? 'Aponte para o preço e toque em Capturar' : 'Posicione o código no centro do quadro'}
        </p>
      </div>

      <div className="relative w-full aspect-square max-w-sm overflow-hidden rounded-3xl border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20">
        {mode === 'ocr' ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-emerald-400 rounded-lg" />
            </div>
          </>
        ) : (
          <div id="reader" className="w-full h-full [&>video]:object-cover" />
        )}
      </div>

      <div className="mt-12 w-full max-w-xs">
        {mode === 'ocr' && isScanning && (
          <button
            onClick={captureAndOCR}
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform"
          >
            <Camera className="w-6 h-6" />
            Capturar Preço
          </button>
        )}

        {ocrProgress > 0 && ocrProgress < 1 && (
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${ocrProgress * 100}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
