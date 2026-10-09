import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPacienteById,
  atualizarPaciente,
  getConsultasByPaciente,
  criarConsulta,
  AtualizarPacienteData,
  ConsultaItem,
  NovaConsultaData,
} from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PacienteDadosEditSection } from '@/components/PacienteDadosEditSection';
import { ConsultasSection } from '@/components/ConsultasSection';
import { PlanoAlimentarSection } from '@/components/PlanoAlimentarSection';
import {
  ArrowLeft,
  Phone,
  Mail,
  Weight,
  Ruler,
  AlertCircle,
  Calendar,
  Utensils,
  UserCheck,
} from 'lucide-react';

export const PacientePerfil: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState<any>(null);
  const [consultas, setConsultas] = useState<ConsultaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConsultas, setIsLoadingConsultas] = useState(true);

  // Controle de seção ativa no perfil: 'dados' | 'consultas' | 'planos'
  const [activeMainSection, setActiveMainSection] = useState<'dados' | 'consultas' | 'planos'>('dados');

  const loadPaciente = useCallback(async () => {
    if (!id || !user?.id) return;
    try {
      const data = await getPacienteById(id, user.id);
      setPaciente(data);
    } catch (err) {
      console.error('Erro ao buscar dados do paciente:', err);
    }
  }, [id, user?.id]);

  const loadConsultas = useCallback(async () => {
    if (!id) return;
    setIsLoadingConsultas(true);
    try {
      const data = await getConsultasByPaciente(id);
      setConsultas(data);
    } catch (err) {
      console.error('Erro ao buscar consultas:', err);
    } finally {
      setIsLoadingConsultas(false);
    }
  }, [id]);

  useEffect(() => {
    async function loadAll() {
      setIsLoading(true);
      await Promise.all([loadPaciente(), loadConsultas()]);
      setIsLoading(false);
    }
    loadAll();
  }, [loadPaciente, loadConsultas]);

  // Handler de atualização de dados do paciente
  const handleSalvarDadosPaciente = async (novosDados: AtualizarPacienteData) => {
    if (!id || !user?.id) return { success: false, error: 'Usuário não autenticado' };
    const res = await atualizarPaciente(id, user.id, novosDados);
    if (res.success) {
      await loadPaciente();
    }
    return res;
  };

  // Handler de registro de nova consulta
  const handleSalvarNovaConsulta = async (novaConsulta: NovaConsultaData) => {
    const res = await criarConsulta(novaConsulta);
    if (res.success) {
      await loadConsultas();
    }
    return res;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p>Carregando prontuário do paciente...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Paciente não encontrado</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          O paciente solicitado não existe ou você não tem permissão para visualizá-lo.
        </p>
        <Button onClick={() => navigate('/pacientes')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar para Lista de Pacientes
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/pacientes')}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar para Pacientes
        </button>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
          Prontuário Ativo
        </span>
      </div>

      {/* Cartão de Cabeçalho Resumido do Perfil */}
      <Card className="border-emerald-100/80 overflow-hidden bg-white shadow-sm">
        <div className="h-16 sm:h-20 bg-gradient-to-r from-emerald-600 to-teal-500" />
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-7 sm:-mt-8 mb-3 sm:mb-4 gap-3 sm:gap-4">
            <div className="flex items-center sm:items-end gap-3 sm:gap-3.5 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 shadow-md border border-slate-100 flex-shrink-0">
                <div className="w-full h-full rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xl">
                  {paciente.nome?.charAt(0).toUpperCase() || 'P'}
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-tight truncate">
                  {paciente.nome}
                </h1>
                <p className="text-xs text-slate-500 truncate">
                  Cadastrado em {new Date(paciente.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {paciente.whatsapp && (
                <a
                  href={`https://wa.me/${paciente.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto justify-center inline-flex items-center px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 mr-1.5" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="truncate">{paciente.email || 'Email não informado'}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="truncate">{paciente.whatsapp || paciente.telefone || 'Sem telefone'}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Weight className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="truncate">Peso: {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '—'}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Ruler className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="truncate">Altura: {paciente.altura ? `${paciente.altura} cm` : '—'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* SELETOR DE SEÇÕES PRINCIPAIS (PROMPT 5: DADOS, CONSULTAS, PLANOS) */}
      <div className="grid grid-cols-3 bg-white border border-slate-200/90 rounded-2xl p-1 sm:p-1.5 shadow-xs gap-1 sm:gap-2">
        <button
          onClick={() => setActiveMainSection('dados')}
          className={`py-2 sm:py-2.5 px-1.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all text-center min-w-0 ${
            activeMainSection === 'dados'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4 flex-shrink-0" />
          <span className="sm:hidden text-[11px] font-bold">1. Dados</span>
          <span className="hidden sm:inline">Seção 1: Dados do Paciente</span>
        </button>

        <button
          onClick={() => setActiveMainSection('consultas')}
          className={`py-2 sm:py-2.5 px-1.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all text-center min-w-0 ${
            activeMainSection === 'consultas'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="sm:hidden text-[11px] font-bold">2. Consultas</span>
          <span className="hidden sm:inline">Seção 2: Consultas & Evolução</span>
        </button>

        <button
          onClick={() => setActiveMainSection('planos')}
          className={`py-2 sm:py-2.5 px-1.5 sm:px-4 rounded-xl text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all text-center min-w-0 ${
            activeMainSection === 'planos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Utensils className="w-4 h-4 flex-shrink-0" />
          <span className="sm:hidden text-[11px] font-bold">3. Planos</span>
          <span className="hidden sm:inline">Seção 3: Planos Alimentares</span>
        </button>
      </div>

      {/* SEÇÃO 1: DADOS DO PACIENTE (EDITÁVEL NAS 3 ABAS) */}
      {activeMainSection === 'dados' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Edição de Anamnese e Dados</h2>
            <span className="text-xs text-slate-400">Edite os campos e clique em Salvar Alterações</span>
          </div>
          <PacienteDadosEditSection
            key={paciente.id + (paciente.updated_at || '')}
            paciente={paciente}
            onSalvar={handleSalvarDadosPaciente}
          />
        </div>
      )}

      {/* SEÇÃO 2: CONSULTAS & EVOLUÇÃO DE PESO */}
      {activeMainSection === 'consultas' && (
        <div className="animate-fadeIn">
          <ConsultasSection
            pacienteId={paciente.id}
            pesoInicial={paciente.peso_inicial}
            consultas={consultas}
            isLoading={isLoadingConsultas}
            onSalvarNovaConsulta={handleSalvarNovaConsulta}
          />
        </div>
      )}

      {/* SEÇÃO 3: PLANOS ALIMENTARES */}
      {activeMainSection === 'planos' && (
        <div className="animate-fadeIn">
          <PlanoAlimentarSection paciente={paciente} />
        </div>
      )}
    </div>
  );
};


