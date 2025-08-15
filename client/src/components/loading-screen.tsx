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
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <div className="text-center space-y-8 max-w-md w-full px-4">
        {/* Logo */}
        <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-6">
          <Box className="text-primary-foreground text-2xl" size={24} />
        </div>
        
        <h1 className="text-3xl font-medium text-foreground mb-2">TOTVS RM</h1>
        
        {/* Barra de progresso */}
        <div className="space-y-4 w-full">
          <Progress value={progress} className="h-2 w-full" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;