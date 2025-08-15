import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEBHOOK_URL = 'https://webhook-n8n.simpleit.app.br/webhook/b62a449f-0043-4fe5-811d-e25fc587772d/chat';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function AssistenteVirtualRH() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gerar sessionId único
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Enviar mensagem de boas-vindas
    sendWelcomeMessage(newSessionId);
  }, []);

  // Auto-scroll suave para a última mensagem
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages]);

  // Garantir foco no input após carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const sendWelcomeMessage = async (sessionId: string) => {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'loadPreviousSession',
          sessionId: sessionId,
          chatInput: 'Olá'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.output) {
          addMessage(data.output, 'bot');
        } else {
          addMessage('Olá! 👋 Sou seu assistente virtual de RH. Como posso ajudá-lo hoje?', 'bot');
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem de boas-vindas:', error);
      addMessage('Olá! 👋 Sou seu assistente virtual de RH. Como posso ajudá-lo hoje?', 'bot');
    }
    
    // Focar no input após mensagem de boas-vindas
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  };

  const addMessage = (content: string, sender: 'user' | 'bot') => {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      sender,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Scroll adicional após adicionar mensagem
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Focar imediatamente no input após limpar
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    // Adicionar mensagem do usuário
    addMessage(userMessage, 'user');

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId: sessionId,
          chatInput: userMessage
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.output) {
          addMessage(data.output, 'bot');
        } else {
          addMessage('Desculpe, não consegui processar sua mensagem. Tente novamente.', 'bot');
        }
      } else {
        addMessage('Erro na comunicação. Tente novamente em alguns instantes.', 'bot');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      addMessage('Erro de conexão. Verifique sua internet e tente novamente.', 'bot');
    } finally {
      setIsLoading(false);
      // Garantir foco no input após resposta
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl h-[calc(100vh-8rem-6px)] flex flex-col">
      {/* Cabeçalho */}
      <div className="pb-6 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MessageCircle className="h-8 w-8 text-purple-600" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Assistente Virtual - RH</h1>
            <p className="text-sm text-gray-500">Online • Responde em segundos</p>
          </div>
        </div>
      </div>
      
      {/* Área do Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Área de Mensagens */}
        <ScrollArea className="flex-1 px-4 pt-6 pb-12" ref={scrollAreaRef}>
          <div className="space-y-6 min-h-full">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Inicie uma conversa com o assistente virtual de RH</p>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-3 animate-in slide-in-from-bottom-2 duration-300",
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                  message.sender === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                )}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Mensagem */}
                <div className={cn(
                  "flex-1 max-w-[75%]",
                  message.sender === 'user' ? 'text-right' : ''
                )}>
                  <div className={cn(
                    "inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                    message.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                  )}>
                    <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                  </div>
                  <div className={cn(
                    "text-xs text-gray-400 mt-2 px-1",
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  )}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Indicador de digitação */}
            {isLoading && (
              <div className="flex items-start space-x-3 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Espaçamento final para scroll suave e evitar sobreposição com a barra de status */}
            <div className="h-16"></div>
          </div>
        </ScrollArea>

        {/* Área de Input */}
        <div className="border-t bg-white/80 backdrop-blur-sm p-4">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="bg-purple-600 hover:bg-purple-700 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Pressione Enter para enviar • Powered by SimpleIT
          </p>
        </div>
      </div>
    </div>
  );
}