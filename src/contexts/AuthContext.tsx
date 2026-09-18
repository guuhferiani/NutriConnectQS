import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authClient, AuthUser, AuthSession } from '@/lib/auth';
import { syncNutricionista } from '@/lib/db';

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Traduz mensagens de erro técnicas para termos claros e amigáveis em português
export function formatAuthError(error: any): string {
  if (!error) return 'Ocorreu um erro inesperado. Tente novamente.';
  const message = typeof error === 'string' ? error : error.message || error.code || '';
  const lower = message.toLowerCase();

  if (lower.includes('invalid email or password') || lower.includes('invalid_email_or_password') || lower.includes('invalid password') || lower.includes('credentials')) {
    return 'E-mail ou senha incorretos. Verifique os dados e tente novamente.';
  }
  if (lower.includes('user already exists') || lower.includes('already exists') || lower.includes('duplicate')) {
    return 'Este e-mail já está cadastrado. Clique em "Já tem conta? Faça login" para entrar.';
  }
  if (lower.includes('password') && (lower.includes('short') || lower.includes('length') || lower.includes('least'))) {
    return 'A senha deve ter no mínimo 9 caracteres.';
  }
  if (lower.includes('invalid email') || lower.includes('email format')) {
    return 'Por favor, informe um endereço de e-mail válido.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('connection')) {
    return 'Não foi possível conectar ao serviço de autenticação. Verifique sua conexão com a internet.';
  }
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns minutos e tente novamente.';
  }

  return message || 'Não foi possível concluir a operação. Tente novamente.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega e restaura a sessão ativa
  const refreshSession = useCallback(async () => {
    try {
      const result = await authClient.getSession();
      if (result?.data?.session && result?.data?.user) {
        setSession(result.data.session as AuthSession);
        setUser(result.data.user as AuthUser);

        // Garante que o nutricionista esteja salvo na tabela nutricionistas
        if (result.data.user.id && result.data.user.email) {
          syncNutricionista(
            result.data.user.id,
            result.data.user.name || result.data.user.email.split('@')[0],
            result.data.user.email
          ).catch((e) => console.warn('Sync background check:', e));
        }
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('Erro ao obter sessão ativa:', err);
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Login
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (response.error) {
        return { success: false, error: formatAuthError(response.error) };
      }

      // Atualiza estado local da sessão
      const sessionRes = await authClient.getSession();
      if (sessionRes?.data?.session && sessionRes?.data?.user) {
        setSession(sessionRes.data.session as AuthSession);
        setUser(sessionRes.data.user as AuthUser);

        // Sincroniza/assegura na tabela nutricionistas
        syncNutricionista(
          sessionRes.data.user.id,
          sessionRes.data.user.name || email.split('@')[0],
          email.trim()
        ).catch((e) => console.warn('Erro na sincronização pós-login:', e));

        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err) };
    }
  };

  // Cadastro de novo nutricionista
  const signUp = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (password.length < 9) {
        return { success: false, error: 'A senha deve ter no mínimo 9 caracteres.' };
      }

      const cleanEmail = email.trim();
      const cleanName = name.trim();

      const response = await authClient.signUp.email({
        name: cleanName,
        email: cleanEmail,
        password,
      });

      if (response.error) {
        return { success: false, error: formatAuthError(response.error) };
      }

      // Obter sessão após cadastro
      const sessionRes = await authClient.getSession();
      const createdUser = (sessionRes?.data?.user || response?.data?.user) as AuthUser | undefined;
      const currentSession = sessionRes?.data?.session as AuthSession | undefined;

      if (createdUser) {
        setUser(createdUser);
        if (currentSession) {
          setSession(currentSession);
        }

        // Regra importante: Salvar o nome e email na tabela `nutricionistas` do Neon
        await syncNutricionista(createdUser.id, cleanName, cleanEmail);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err) };
    }
  };

  // Logout
  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (e) {
      console.warn('Erro ao deslogar:', e);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
