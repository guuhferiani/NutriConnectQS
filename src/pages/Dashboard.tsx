import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardMetrics, DashboardMetrics } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  Database,
  CalendarX,
  Phone,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = useCallback(
    async (isManualRefresh = false) => {
      if (!user?.id) return;

      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const data = await getDashboardMetrics(user.id);
        setMetrics(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Erro ao carregar métricas do Neon:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Cabeçalho de Boas-Vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Olá, {user?.name || 'Dr(a). Nutricionista'}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aqui está o resumo dos seus atendimentos e acompanhamento de pacientes em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="hidden lg:inline text-xs text-slate-400">
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3.5 h-3.5 mr-0.5" />
            Neon conectado
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetrics(true)}
            disabled={isLoading || isRefreshing}
            className="text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`}
            />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </Button>
        </div>
      </div>

      {/* Grid com Cards 1 e 2 (Métricas Principais) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 — Total de pacientes ativos */}
        <Card className="border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-emerald-100/80 text-emerald-700">
                <Users className="w-6 h-6" />
              </div>
              <Link
                to="/pacientes"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <span>Ver lista</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardTitle className="text-base font-semibold text-slate-700 mt-3">
              Total de Pacientes Ativos
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Pacientes cadastrados pela nutricionista logada
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {metrics?.totalPacientes ?? 0}
                </span>
                <span className="text-xs font-medium text-slate-400">pacientes cadastrados</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2 — Consultas da semana */}
        <Card className="border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-teal-100/80 text-teal-700">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                Semana atual
              </span>
            </div>
            <CardTitle className="text-base font-semibold text-slate-700 mt-3">
              Consultas da Semana
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Consultas registradas na semana corrente
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {metrics?.consultasSemana ?? 0}
                </span>
                <span className="text-xs font-medium text-slate-400">atendimentos realizados</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Card 3 — Pacientes sem retorno */}
      <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100/80 text-amber-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  Pacientes sem Retorno
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Última consulta há mais de 30 dias e sem próximo retorno agendado
                </CardDescription>
              </div>
            </div>

            {!isLoading && metrics && (
              <span
                className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold ${
                  metrics.pacientesSemRetorno.length > 0
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {metrics.pacientesSemRetorno.length}{' '}
                {metrics.pacientesSemRetorno.length === 1 ? 'paciente' : 'pacientes'}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 mb-3 animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-sm text-slate-500">Carregando dados dos pacientes...</p>
            </div>
          ) : !metrics || metrics.pacientesSemRetorno.length === 0 ? (
            /* Estado vazio: mensagem exigida no Prompt 3 */
            <div className="py-12 px-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Nenhum paciente sem retorno no momento
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Ótimo trabalho! Todos os seus pacientes atendidos tiveram consultas recentes ou já
                possuem uma data de próximo retorno agendada.
              </p>
            </div>
          ) : (
            /* Lista de pacientes sem retorno */
            <div className="divide-y divide-slate-100">
              {metrics.pacientesSemRetorno.map((paciente) => (
                <div
                  key={paciente.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 -mx-3 px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200/60 flex-shrink-0">
                      {paciente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      {/* Nome clicável redirecionando para o perfil do paciente */}
                      <Link
                        to={`/pacientes/${paciente.id}`}
                        className="font-bold text-sm text-slate-900 hover:text-emerald-700 flex items-center gap-1.5 transition-colors group"
                        title="Ver perfil do paciente"
                      >
                        <span>{paciente.nome}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <CalendarX className="w-3 h-3 text-amber-500" />
                          Última consulta:{' '}
                          {new Date(paciente.ultima_consulta).toLocaleDateString('pt-BR')}
                        </span>
                        <span>•</span>
                        <span className="text-amber-700 font-medium">
                          Há {paciente.dias_sem_consulta} dias
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {paciente.whatsapp && (
                      <a
                        href={`https://wa.me/${paciente.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
                        title="Entrar em contato via WhatsApp"
                      >
                        <Phone className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <Link
                      to={`/pacientes/${paciente.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors shadow-xs"
                    >
                      <span>Ver perfil</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
