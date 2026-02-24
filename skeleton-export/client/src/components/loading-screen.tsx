import React, { useState, useEffect, useRef } from 'react';
import { Progress } from "@/components/ui/progress";
import { Box } from "lucide-react";
import { StartupCheckService } from "@/lib/startup-check";

interface LoadingScreenProps {
  duration?: number; // duração em milissegundos
  onComplete?: () => void;
  customMessage?: string;
  progressValue?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  duration = 5000,
  onComplete,
  customMessage,
  progressValue
}) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [internalMessage, setInternalMessage] = useState("Iniciando...");
  const hasStartedRef = useRef(false);

  const isControlled = typeof progressValue === 'number';

  useEffect(() => {
    if (isControlled) return;
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let cancelled = false;

    const run = async () => {
      setInternalProgress(5);
      setInternalMessage("Carregando lista de sentenças...");

      try {
        await StartupCheckService.checkConfiguration((sentence, current, total) => {
          if (cancelled) return;
          const safeTotal = Math.max(1, total);
          const pct = 5 + Math.floor((current / safeTotal) * 90);
          setInternalProgress(Math.min(95, pct));
          setInternalMessage(`Verificando ${sentence} (${current}/${total})...`);
        });

        if (cancelled) return;
        setInternalProgress(100);
        setInternalMessage("Concluído");
      } catch (error) {
        if (cancelled) return;

        try {
          const logData = {
            timestamp: new Date().toISOString(),
            items: [
              {
                sentence: "-",
                status: 'error' as const,
                message: error instanceof Error ? error.message : String(error)
              }
            ]
          };
          localStorage.setItem('startup_check_log', JSON.stringify(logData));
        } catch {
        }

        setInternalProgress(100);
        setInternalMessage("Concluído");
      } finally {
        if (cancelled) return;
        setTimeout(() => {
          if (!cancelled) onComplete?.();
        }, Math.min(250, duration));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [duration, onComplete, isControlled]);

  const displayProgress = isControlled ? progressValue : internalProgress;
  const displayMessage = customMessage || internalMessage;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#121212] z-50">
      <div className="text-center space-y-8 max-w-md w-full px-4">
        {/* Logo */}
        <div className="mx-auto h-20 w-20 bg-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
          <Box className="text-black text-4xl" size={40} />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">TOTVS RM</h1>
        
        {/* Barra de progresso */}
        <div className="space-y-4 w-full">
          <Progress 
            value={displayProgress} 
            className="h-2 w-full bg-[#2D2D2D] [&>div]:bg-yellow-500" 
          />
          <p className="text-sm text-gray-400 font-medium">{displayMessage}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
