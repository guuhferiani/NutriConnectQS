import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConsultaItem, NovaConsultaData } from '@/lib/db';
import {
  Calendar,
  Plus,
  TrendingDown,
  TrendingUp,
  Minus,
  X,
  Clock,
  Percent,
  AlertCircle,
  Activity
} from 'lucide-react';

interface ConsultasSectionProps {
  pacienteId: string;
  pesoInicial?: number | null;
  consultas: ConsultaItem[];
  isLoading: boolean;
  onSalvarNovaConsulta: (dados: NovaConsultaData) => Promise<{ success: boolean; error?: any }>;
}

export const ConsultasSection: React.FC<ConsultasSectionProps> = ({
  pacienteId,
  pesoInicial,
  consultas,
  isLoading,
  onSalvarNovaConsulta,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Form Modal state
  const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0]);
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [percentualGordura, setPercentualGordura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [proximoRetorno, setProximoRetorno] = useState('');

  const handleOpenModal = () => {
    setDataConsulta(new Date().toISOString().split('T')[0]);
    setPeso('');
    setCintura('');
    setQuadril('');
    setPercentualGordura('');
    setObservacoes('');
    setProximoRetorno('');
    setErrorModal(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setErrorModal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peso) {
      setErrorModal('O peso atual é obrigatório para registrar a consulta.');
      return;
    }

    setIsSaving(true);
    setErrorModal(null);

    const pesoNum = parseFloat(peso.replace(',', '.'));
    const cinturaNum = cintura ? parseFloat(cintura.replace(',', '.')) : null;
    const quadrilNum = quadril ? parseFloat(quadril.replace(',', '.')) : null;
    const gorduraNum = percentualGordura ? parseFloat(percentualGordura.replace(',', '.')) : null;

    const novaConsulta: NovaConsultaData = {
      paciente_id: pacienteId,
      data_consulta: dataConsulta,
      peso: pesoNum > 0 ? pesoNum : null,
      cintura: cinturaNum,
      quadril: quadrilNum,
      percentual_gordura: gorduraNum,
      observacoes: observacoes.trim() || null,
      proximo_retorno: proximoRetorno || null,
    };

    const res = await onSalvarNovaConsulta(novaConsulta);
    setIsSaving(false);

    if (res.success) {
      setIsModalOpen(false);
    } else {
      setErrorModal(res.error?.message || 'Falha ao salvar consulta no banco de dados.');
    }
  };

  // Preparação de pontos para o Gráfico de Evolução de Peso
  // Ordena em ordem cronológica (antigo para o mais recente)
  const pontosGrafico = React.useMemo(() => {
    const pontos: { data: string; peso: number; label: string }[] = [];

    // Se tiver peso inicial cadastrado e não houver consultas ou a primeira for posterior
    const sortedConsultas = [...consultas].sort(
      (a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime()
    );

    sortedConsultas.forEach((c) => {
      if (c.peso && c.peso > 0) {
        pontos.push({
          data: c.data_consulta,
          peso: c.peso,
          label: new Date(c.data_consulta).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        });
      }
    });

    return pontos;
  }, [consultas]);

  // Cálculo de limites do gráfico SVG
  const minPeso = pontosGrafico.length > 0 ? Math.min(...pontosGrafico.map((p) => p.peso)) - 2 : 50;
  const maxPeso = pontosGrafico.length > 0 ? Math.max(...pontosGrafico.map((p) => p.peso)) + 2 : 100;
  const rangePeso = maxPeso - minPeso || 1;

  const svgWidth = 600;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 30;

  const getCoordinates = (idx: number, pesoVal: number) => {
    const count = pontosGrafico.length;
    const x = count === 1 ? svgWidth / 2 : paddingX + (idx / (count - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((pesoVal - minPeso) / rangePeso) * (svgHeight - paddingY * 2);
    return { x, y };
  };

  const polylinePoints = pontosGrafico
    .map((p, idx) => {
      const { x, y } = getCoordinates(idx, p.peso);
      return `${x},${y}`;
    })
    .join(' ');

  // Variação em relação à primeira consulta ou peso inicial
  const pesoMaisRecente = consultas.find((c) => c.peso && c.peso > 0)?.peso || null;
  const pesoReferencia = pesoInicial || (pontosGrafico.length > 0 ? pontosGrafico[0].peso : null);
  const diferencaPeso = pesoMaisRecente && pesoReferencia ? Number((pesoMaisRecente - pesoReferencia).toFixed(1)) : null;

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA SEÇÃO DE CONSULTAS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Consultas & Evolução</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Histórico completo de atendimentos antropométricos e métricas corporais
          </p>
        </div>

        <Button
          onClick={handleOpenModal}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Consulta
        </Button>
      </div>

      {/* GRÁFICO DE EVOLUÇÃO DE PESO EM DESTAQUE */}
      <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-5 pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Gráfico de Evolução de Peso
            </CardTitle>
            <p className="text-[11px] text-slate-400">Progresso ao longo de cada consulta realizada</p>
          </div>

          {diferencaPeso !== null && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500 font-medium">Variação total:</span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  diferencaPeso < 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : diferencaPeso > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {diferencaPeso < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : diferencaPeso > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {diferencaPeso > 0 ? `+${diferencaPeso} kg` : `${diferencaPeso} kg`}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-5">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
              Carregando histórico do gráfico...
            </div>
          ) : pontosGrafico.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Nenhuma consulta registrada ainda</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Cadastre a primeira consulta clicando em <strong>"Nova Consulta"</strong> para visualizar a linha de tendência e gráficos de evolução.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[500px]">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-48 overflow-visible"
                >
                  {/* Linhas de Grade de Fundo */}
                  <line
                    x1={paddingX}
                    y1={paddingY}
                    x2={svgWidth - paddingX}
                    y2={paddingY}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <line
                    x1={paddingX}
                    y1={svgHeight / 2}
                    x2={svgWidth - paddingX}
                    y2={svgHeight / 2}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <line
                    x1={paddingX}
                    y1={svgHeight - paddingY}
                    x2={svgWidth - paddingX}
                    y2={svgHeight - paddingY}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />

                  {/* Linha do Gráfico */}
                  {pontosGrafico.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={polylinePoints}
                    />
                  )}

                  {/* Pontos Interativos */}
                  {pontosGrafico.map((p, idx) => {
                    const { x, y } = getCoordinates(idx, p.peso);
                    return (
                      <g key={idx} className="group cursor-pointer">
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#ffffff"
                          stroke="#059669"
                          strokeWidth="3"
                          className="transition-transform group-hover:scale-125"
                        />
                        {/* Tooltip text acima do ponto */}
                        <text
                          x={x}
                          y={y - 12}
                          textAnchor="middle"
                          fill="#0f172a"
                          className="text-[11px] font-extrabold"
                        >
                          {p.peso} kg
                        </text>
                        {/* Data abaixo da linha */}
                        <text
                          x={x}
                          y={svgHeight - 10}
                          textAnchor="middle"
                          fill="#64748b"
                          className="text-[10px] font-medium"
                        >
                          {p.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LISTAGEM DE CONSULTAS EM ORDEM CRONOLÓGICA DECRESCENTE */}
      <Card className="border-slate-200/90 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600" />
            Histórico de Consultas ({consultas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Carregando consultas...</div>
          ) : consultas.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhuma consulta registrada até o momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {consultas.map((c, idx) => (
                <div
                  key={c.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {new Date(c.data_consulta).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Mais recente
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        Peso: {c.peso ? `${c.peso} kg` : '—'}
                      </span>
                      {c.cintura && <span>Cintura: {c.cintura} cm</span>}
                      {c.quadril && <span>Quadril: {c.quadril} cm</span>}
                      {c.percentual_gordura && (
                        <span className="flex items-center gap-0.5">
                          <Percent className="w-3 h-3 text-teal-600" />
                          Gordura: {c.percentual_gordura}%
                        </span>
                      )}
                    </div>

                    {c.observacoes && (
                      <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        "{c.observacoes}"
                      </p>
                    )}
                  </div>

                  {c.proximo_retorno && (
                    <div className="text-right text-xs self-start md:self-center">
                      <span className="text-[11px] text-slate-400 block font-medium">Próximo Retorno</span>
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {new Date(c.proximo_retorno).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL NOVA CONSULTA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Registrar Nova Consulta</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorModal && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorModal}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Consulta <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dataConsulta}
                    onChange={(e) => setDataConsulta(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peso Atual <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="Ex: 72.5"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                      kg
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cintura
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="80"
                      value={cintura}
                      onChange={(e) => setCintura(e.target.value)}
                      className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Quadril
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="98"
                      value={quadril}
                      onChange={(e) => setQuadril(e.target.value)}
                      className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    % Gordura
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="22.5"
                      value={percentualGordura}
                      onChange={(e) => setPercentualGordura(e.target.value)}
                      className="w-full px-3 py-2 pr-6 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data do Próximo Retorno (Opcional)
                </label>
                <input
                  type="date"
                  value={proximoRetorno}
                  onChange={(e) => setProximoRetorno(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações da Consulta
                </label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Relato de adesão à dieta, queixas, mudanças de medidas, metas para a próxima consulta..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                >
                  {isSaving ? 'Salvando Consulta...' : 'Salvar Consulta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
