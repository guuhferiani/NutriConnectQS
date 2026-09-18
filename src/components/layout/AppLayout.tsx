import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Pacientes',
      path: '/pacientes',
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Overlay para Mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Fixa Desktop & Drawer Mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0',
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:shadow-none'
        )}
      >
        {/* Topo da Sidebar com a Logo */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">
          <NavLink to="/dashboard" className="focus:outline-none">
            <Logo size="sm" showSubtitle={false} className="items-start" />
          </NavLink>
          <button
            type="button"
            className="md:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links de Navegação */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navegação Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm shadow-emerald-500/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-5 rounded-full bg-emerald-600" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Rodapé da Sidebar - Usuário & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase border border-emerald-200 shadow-sm flex-shrink-0">
              {user?.name ? user.name.slice(0, 2) : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.name || 'Nutricionista'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50/80 transition-colors border border-slate-200 hover:border-red-200 bg-white shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Barra Superior Mobile */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 h-16 px-4 flex items-center justify-between">
          <Logo size="sm" showSubtitle={false} className="items-start" />
          <button
            type="button"
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Conteúdo Renderizado da Rota */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
