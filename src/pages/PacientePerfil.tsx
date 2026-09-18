import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getPacienteById } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Phone,
  Mail,
  Weight,
  Ruler,
  AlertCircle,
  Activity,
  HeartPulse,
} from 'lucide-react';

export const PacientePerfil: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id || !user?.id) return;
      setIsLoading(true);
      try {
        const data = await getPacienteById(id, user.id);
        setPaciente(data);
      } catch (err) {
        console.error('Erro ao buscar dados do paciente:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, user?.id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p>Carregando perfil do paciente...</p>
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
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar
        </button>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
          Prontuário Ativo
        </span>
      </div>

      {/* Cartão de Cabeçalho do Perfil */}
      <Card className="border-emerald-100/80 overflow-hidden bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-500" />
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-10 mb-4 gap-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md border border-slate-100 flex-shrink-0">
                <div className="w-full h-full rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-2xl">
                  {paciente.nome?.charAt(0).toUpperCase() || 'P'}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">{paciente.nome}</h1>
                <p className="text-xs text-slate-500">
                  Cadastrado em {new Date(paciente.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {paciente.whatsapp && (
                <a
                  href={`https://wa.me/${paciente.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 mr-1.5" />
                  Enviar WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="truncate">{paciente.email || 'Email não informado'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{paciente.whatsapp || paciente.telefone || 'Sem telefone'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>Peso inicial: {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>Altura: {paciente.altura ? `${paciente.altura} cm` : '—'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Detalhes Clínicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
              <Activity className="w-5 h-5 text-emerald-600" />
              Objetivos & Hábitos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div>
              <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Objetivo Principal
              </span>
              <p>{paciente.objetivo_texto || 'Não especificado'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Nível de Atividade Física
              </span>
              <p>{paciente.nivel_atividade || 'Não informado'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Ingestão de Água Diária
              </span>
              <p>{paciente.litros_agua ? `${paciente.litros_agua} litros/dia` : 'Não informado'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
              <HeartPulse className="w-5 h-5 text-emerald-600" />
              Restrições & Saúde
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div>
              <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Alergias / Restrições
              </span>
              <p>
                {Array.isArray(paciente.alergias) && paciente.alergias.length > 0
                  ? paciente.alergias.join(', ')
                  : 'Nenhuma alergia registrada'}
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Medicamentos em Uso
              </span>
              <p>{paciente.medicamentos || 'Nenhum'}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider text-slate-400 mb-1">
                Suplementação Atual
              </span>
              <p>{paciente.suplementos || 'Nenhuma'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
