import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { PublicRoute } from '@/components/PublicRoute';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Pacientes } from '@/pages/Pacientes';
import { PacientePerfil } from '@/pages/PacientePerfil';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas (acessíveis apenas para quem NÃO está logado) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Rotas Protegidas com Menu Lateral Fixo (AppLayout) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/pacientes/:id" element={<PacientePerfil />} />
            </Route>
          </Route>

          {/* Redirecionamento padrão da raiz para o Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Redirecionamento para qualquer outra rota inexistente */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
