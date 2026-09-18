import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validação em tempo real dos requisitos de senha
  const hasMinLength = password.length >= 9;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações
    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Por favor, informe um endereço de e-mail.');
      return;
    }

    if (!hasMinLength) {
      setErrorMessage('A senha deve ter no mínimo 9 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem. Verifique a confirmação de senha.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signUp(name, email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Não foi possível concluir o cadastro.');
      } else {
        // Redireciona para o dashboard após o cadastro
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro ao criar sua conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-mesh flex flex-col justify-center items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo NutriConnect no topo */}
        <div className="text-center">
          <Logo size="lg" className="mb-2" />
        </div>

        {/* Card de Cadastro */}
        <Card className="glass-card shadow-2xl shadow-emerald-950/5 border-emerald-100/80">
          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-2xl font-bold text-slate-800">
              Criar sua conta
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              Cadastre-se para começar a estruturar planos nutricionais
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-5 animate-in fade-in duration-200">
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Nome Completo */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Nome completo
                </label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Dra. Gabriela Souza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="h-4 w-4" />}
                  required
                />
              </div>

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
                  autoComplete="new-password"
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

              {/* Campo Confirmar Senha */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Confirmar senha
                </label>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="•••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      tabIndex={-1}
                      title={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  required
                />
              </div>

              {/* Indicadores de Validação Visual */}
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  {hasMinLength ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
                  )}
                  <span className={hasMinLength ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                    Senha com no mínimo 9 caracteres ({password.length}/9)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {passwordsMatch ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
                  )}
                  <span className={passwordsMatch ? 'text-emerald-800 font-medium' : 'text-slate-500'}>
                    As senhas são idênticas
                  </span>
                </div>
              </div>

              {/* Botão Criar Conta */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold text-base shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/35"
                  isLoading={isSubmitting}
                >
                  Criar conta
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-slate-100/80 pt-5 pb-6 text-center text-sm text-slate-600">
            <p>
              Já tem conta?{' '}
              <Link
                to="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
              >
                Faça login
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-slate-400">
          NutriConnect — Gestão Segura &amp; Nutrição de Alta Performance
        </p>
      </div>
    </div>
  );
};
