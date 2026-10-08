import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getPacientes, PacienteItem } from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Search,
  Plus,
  Phone,
  ChevronRight,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export const Pacientes: React.FC = () => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<PacienteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPacientes = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await getPacientes(user.id);
      setPacientes(data);
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, [user?.id]);

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.whatsapp && p.whatsapp.includes(searchQuery))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-emerald-600" />
            Pacientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lista completa de pacientes cadastrados sob sua responsabilidade
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPacientes}
            disabled={isLoading}
            className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Link to="/pacientes/novo">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Novo Paciente
            </Button>
          </Link>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar paciente por nome, e-mail ou WhatsApp..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
        />
      </div>

      {/* Lista de Pacientes */}
      {isLoading ? (
        <Card className="p-12 text-center border-slate-200">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 mb-3 animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm text-slate-500">Carregando pacientes do Neon...</p>
        </Card>
      ) : filteredPacientes.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-300 bg-white">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <UserCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {searchQuery ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado ainda'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {searchQuery
              ? `Não foram encontrados resultados para "${searchQuery}". Tente outro termo.`
              : 'Comece cadastrando seu primeiro paciente para acompanhar consultas, anamnese e planos alimentares.'}
          </p>
          {!searchQuery && (
            <Link to="/pacientes/novo">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Cadastrar Primeiro Paciente
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPacientes.map((paciente) => {
            const objetivoExibicao =
              paciente.objetivo_texto ||
              (Array.isArray(paciente.objetivos) && paciente.objetivos.length > 0
                ? paciente.objetivos.join(', ')
                : 'Não informado');

            return (
              <Link
                key={paciente.id}
                to={`/pacientes/${paciente.id}`}
                className="group block bg-white border border-slate-200/90 rounded-2xl p-5 hover:shadow-md hover:border-emerald-300 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {paciente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {paciente.nome}
                      </h3>
                      <span className="text-xs text-slate-400">
                        Cadastrado em {new Date(paciente.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-slate-500">Objetivo:</span>
                    <span className="font-medium text-emerald-700 max-w-[170px] truncate text-right">
                      {objetivoExibicao}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold text-slate-500">Última consulta:</span>
                    <span className="text-slate-600">
                      {paciente.ultima_consulta
                        ? new Date(paciente.ultima_consulta).toLocaleDateString('pt-BR')
                        : 'Nenhuma consulta'}
                    </span>
                  </div>

                  {paciente.whatsapp && (
                    <div className="flex items-center gap-2 pt-1 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{paciente.whatsapp}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
};
