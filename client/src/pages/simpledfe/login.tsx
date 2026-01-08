import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { loginSchema, forgotPasswordSchema, type LoginData, type ForgotPasswordData } from "@shared/schema";
import { login } from "@/lib/auth";
import { AnimatedLogo } from "@/components/simpledfe/animated-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rememberMe, setRememberMe] = useState(false);
  const [showRegisterLink, setShowRegisterLink] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Listener para a combinação de teclas CTRL + ALT + SHIFT + 9
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.shiftKey && (event.key === '9' || event.code === 'Digit9')) {
        event.preventDefault();
        setShowRegisterLink(true);
        console.log('Combinação de teclas detectada - Link de registro ativado');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${data.user.name}!`,
      });
      // Redireciona para a tela de loading que mostra o logo animado por 10 segundos
      setLocation("/loading");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const res = await apiRequest('POST', '/api/auth/forgot-password', data);
      return await res.json();
    },
    onSuccess: () => {
      setForgotPasswordSuccess(true);
      toast({
        title: "Email enviado!",
        description: "Se o email existir em nossa base, você receberá uma nova senha temporária.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro interno do servidor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onForgotPasswordSubmit = (data: ForgotPasswordData) => {
    forgotPasswordMutation.mutate(data);
  };

  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowForgotPasswordModal(true);
    setForgotPasswordSuccess(false);
    forgotPasswordForm.reset();
  };

  const handleCloseForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordSuccess(false);
    forgotPasswordForm.reset();
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <AnimatedLogo size="lg" showPulse className="mb-4" />
          <h1 className="text-3xl font-bold text-white">SimpleDFe</h1>
          <p className="text-gray-300 mt-2">Sistema de Gestão de Documentos Eletrônicos Inteligente</p>
        </div>

        {/* Login Form */}
        <Card className="glassmorphism border-white/20">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white text-center mb-2">
                  Entrar na Conta
                </h2>
                <p className="text-gray-300 text-center text-sm">
                  Entre com suas credenciais para acessar o sistema
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-gray-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-200">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-white/20"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-300">
                      Lembrar-me
                    </Label>
                  </div>
                  <button 
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className="text-sm text-primary hover:text-secondary transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              {showRegisterLink && (
                <div className="text-center">
                  <p className="text-gray-300 text-sm">
                    Não tem uma conta?{" "}
                    <Link href="/register">
                      <span className="text-primary hover:text-secondary font-medium transition-colors cursor-pointer">
                        Criar conta
                      </span>
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Forgot Password Modal */}
        <Dialog open={showForgotPasswordModal} onOpenChange={setShowForgotPasswordModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">🔐</span>
                Esqueceu sua senha?
              </DialogTitle>
              <DialogDescription>
                {forgotPasswordSuccess ? (
                  "Verifique seu email para receber sua nova senha temporária."
                ) : (
                  "Digite seu email para receber uma nova senha temporária."
                )}
              </DialogDescription>
            </DialogHeader>
            
            {forgotPasswordSuccess ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-600 text-xl">✅</span>
                    <div>
                      <p className="text-green-800 font-medium">Email enviado com sucesso!</p>
                      <p className="text-green-600 text-sm mt-1">
                        Se o email existir em nossa base, você receberá uma nova senha temporária.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 text-lg mt-0.5">🔑</span>
                    <div>
                      <p className="text-blue-800 font-medium">Próximos passos:</p>
                      <ul className="text-blue-700 text-sm mt-1 space-y-1">
                        <li>• Verifique seu email para receber a nova senha</li>
                        <li>• Faça login com a senha temporária</li>
                        <li>• Altere para uma senha de sua preferência</li>
                        <li>• Verifique sua caixa de spam se necessário</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleCloseForgotPasswordModal}
                  className="w-full"
                >
                  Fechar
                </Button>
              </div>
            ) : (
              <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...forgotPasswordForm.register("email")}
                  />
                  {forgotPasswordForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {forgotPasswordForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseForgotPasswordModal}
                    className="flex-1"
                    disabled={forgotPasswordMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={forgotPasswordMutation.isPending}
                    className="flex-1"
                  >
                    {forgotPasswordMutation.isPending ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

