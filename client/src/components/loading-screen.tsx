import React, { useState, useEffect } from 'react';
import { Progress } from "@/components/ui/progress";
import { Box } from "lucide-react";

interface LoadingScreenProps {
  duration?: number; // duração em milissegundos
  onComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  duration = 5000,
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Iniciando...");

  useEffect(() => {
    const messages = [
      "Iniciando...",
      "Configurando permissões...",
      "Verificando URL...",
      "Carregando módulos...",
      "Preparando ambiente...",
      "Quase pronto..."
    ];

    const interval = 100; // atualiza a cada 100ms para animação suave
    const steps = duration / interval;
    const messageChangePoints = [0, 20, 40, 60, 80, 95]; // pontos percentuais para trocar mensagens
    
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(100, Math.floor((currentStep / steps) * 100));
      setProgress(newProgress);
      
      // Atualiza a mensagem com base no progresso atual
      for (let i = messageChangePoints.length - 1; i >= 0; i--) {
        if (newProgress >= messageChangePoints[i]) {
          setMessage(messages[i]);
          break;
        }
      }
      
      if (newProgress >= 100) {
        clearInterval(timer);
        if (onComplete) {
          onComplete();
        }
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [duration, onComplete]);

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
            value={progress} 
            className="h-2 w-full bg-[#2D2D2D] [&>div]:bg-yellow-500" 
          />
          <p className="text-sm text-gray-400 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;