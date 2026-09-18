import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações locais
    if (!email.trim()) {
      setErrorMessage('Por favor, digite seu e-mail.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, digite sua senha.');
      return;
    }

    if (password.length < 9) {
      setErrorMessage('A senha deve ter no mínimo 9 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signIn(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Falha ao autenticar. Verifique suas credenciais.');
      } else {
        // Redireciona para o dashboard após login bem-sucedido
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro ao tentar entrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-mesh flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Container Central */}
      <div className="w-full max-w-md space-y-6">
        {/* Logo NutriConnect no topo */}
        <div className="text-center">
          <Logo size="lg" className="mb-2" />
        </div>

        {/* Card de Login */}
        <Card className="glass-card shadow-2xl shadow-emerald-950/5 border-emerald-100/80">
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-2xl font-bold text-slate-800">
              Acesse sua conta
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              Entre com suas credenciais para gerenciar seus atendimentos
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-5 animate-in fade-in duration-200">
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="exemplo@nutricao.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  required
                />
              </div>

              {/* Campo Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Senha
                  </label>
                  <span className="text-xs text-slate-400">mínimo 9 caracteres</span>
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="•••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      tabIndex={-1}
                      title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  required
                />
              </div>

              {/* Botão Entrar */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold text-base shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/35"
                  isLoading={isSubmitting}
                >
                  Entrar
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-slate-100/80 pt-5 pb-6 text-center text-sm text-slate-600">
            <p>
              Não tem conta?{' '}
              <Link
                to="/register"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                Cadastre-se
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Rodapé institucional sutil */}
        <p className="text-center text-xs text-slate-400">
          NutriConnect — Gestão Segura &amp; Nutrição de Alta Performance
        </p>
      </div>
    </div>
  );
};
