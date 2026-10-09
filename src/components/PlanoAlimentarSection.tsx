import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getPlanosAlimentaresByPaciente, salvarPlanoAlimentar, PlanoAlimentarItem } from '@/lib/db';
import {
  Sparkles,
  Save,
  Clock,
  ChevronRight,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Utensils,
  History,
  FileText,
} from 'lucide-react';


interface Refeicoes {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

interface DiaPlano {
  dia: string;
  refeicoes: Refeicoes;
}

interface PlanoSemanalData {
  plano_semanal: DiaPlano[];
}

interface PlanoAlimentarSectionProps {
  paciente: any;
}

const DIAS_SEMANA_DEFAULT = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const REFEICOES_CONFIG = [
  { key: 'cafe_da_manha', label: '☕ Café da Manhã', color: 'border-amber-200 bg-amber-50/40 text-amber-900' },
  { key: 'lanche_manha', label: '🍎 Lanche da Manhã', color: 'border-emerald-200 bg-emerald-50/40 text-emerald-900' },
  { key: 'almoco', label: '🍲 Almoço', color: 'border-blue-200 bg-blue-50/40 text-blue-900' },
  { key: 'lanche_tarde', label: '🥪 Lanche da Tarde', color: 'border-purple-200 bg-purple-50/40 text-purple-900' },
  { key: 'jantar', label: '🥗 Jantar', color: 'border-teal-200 bg-teal-50/40 text-teal-900' },
] as const;

function createEmptyPlano(): PlanoSemanalData {
  return {
    plano_semanal: DIAS_SEMANA_DEFAULT.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: ['', '', '', '', ''],
        lanche_manha: ['', '', '', '', ''],
        almoco: ['', '', '', '', ''],
        lanche_tarde: ['', '', '', '', ''],
        jantar: ['', '', '', '', ''],
      },
    })),
  };
}

export const PlanoAlimentarSection: React.FC<PlanoAlimentarSectionProps> = ({ paciente }) => {
  const [historico, setHistorico] = useState<PlanoAlimentarItem[]>([]);
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(true);
  
  // Estado do plano em edição / exibição ativa
  const [planoAtual, setPlanoAtual] = useState<PlanoSemanalData | null>(null);
  const [activeDiaIndex, setActiveDiaIndex] = useState(0);
  
  // Estados de IA e Processamento
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Iniciando IA...');
  const [isSaving, setIsSaving] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  // Visualização de histórico selecionado
  const [selectedHistoricoId, setSelectedHistoricoId] = useState<string | null>(null);

  // Carregar histórico do banco
  const carregarHistorico = async () => {
    if (!paciente?.id) return;
    setIsLoadingHistorico(true);
    try {
      const planos = await getPlanosAlimentaresByPaciente(paciente.id);
      setHistorico(planos);
    } catch (err) {
      console.error('Erro ao carregar histórico de planos:', err);
    } finally {
      setIsLoadingHistorico(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, [paciente?.id]);

  // Ciclo de mensagens dinâmicas durante o loading da IA
  useEffect(() => {
    if (!isGeneratingIA) return;

    const messages = [
      'Buscando dados e restrições do paciente...',
      'Analisando objetivos metabólicos...',
      'IA calculando proporções e cardápio brasileiro...',
      'Formatando opções de refeições por dia...',
      'Quase pronto! Estruturando plano semanal...'
    ];

    let step = 0;
    setLoadingMessage(messages[0]);

    const interval = setInterval(() => {
      step = (step + 1) % messages.length;
      setLoadingMessage(messages[step]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isGeneratingIA]);

  // Gerar Plano com IA
  const handleGerarPlanoIA = async () => {
    setIsGeneratingIA(true);
    setStatusFeedback(null);
    setSelectedHistoricoId(null);

    const dadosPacienteFormatados = {
      nome: paciente.nome,
      idade_ou_nascimento: paciente.data_nascimento,
      sexo: paciente.sexo,
      peso: paciente.peso_inicial,
      altura: paciente.altura,
      objetivos: paciente.objetivo_texto || paciente.objetivos,
      nivel_atividade: paciente.nivel_atividade,
      alergias: paciente.alergias,
      restricoes_alimentares: paciente.restricoes_alimentares,
      medicamentos: paciente.medicamentos,
      suplementos: paciente.suplementos,
      rotina: {
        refeicoes_por_dia: paciente.refeicoes_por_dia,
        horario_acorda: paciente.horario_acorda,
        horario_dorme: paciente.horario_dorme,
        litros_agua: paciente.litros_agua,
        atividade_fisica: paciente.atividade_fisica_descricao || paciente.atividade_fisica,
      },
      observacoes: paciente.observacoes,
    };

    try {
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dados_paciente: dadosPacienteFormatados,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}: Falha no servidor.`);
      }

      const data = await response.json();

      let parsedData: PlanoSemanalData;
      if (typeof data === 'string') {
        parsedData = JSON.parse(data);
      } else {
        parsedData = data;
      }

      if (!parsedData.plano_semanal || !Array.isArray(parsedData.plano_semanal)) {
        throw new Error('Formato retornado pela IA é inválido.');
      }

      // Normaliza garantindo que cada refeição tenha 5 itens
      const normalizado: PlanoSemanalData = {
        plano_semanal: parsedData.plano_semanal.map((diaObj) => {
          const refeicoes = diaObj.refeicoes || {};
          return {
            dia: diaObj.dia,
            refeicoes: {
              cafe_da_manha: fillFive(refeicoes.cafe_da_manha),
              lanche_manha: fillFive(refeicoes.lanche_manha),
              almoco: fillFive(refeicoes.almoco),
              lanche_tarde: fillFive(refeicoes.lanche_tarde),
              jantar: fillFive(refeicoes.jantar),
            },
          };
        }),
      };

      setPlanoAtual(normalizado);
      setActiveDiaIndex(0);
      setStatusFeedback({
        type: 'success',
        message: 'Plano alimentar gerado com sucesso pela IA! Você pode editar as opções abaixo antes de salvar.',
      });
    } catch (err: any) {
      console.error('Erro na requisição da IA:', err);
      setStatusFeedback({
        type: 'error',
        message:
          'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
      });
    } finally {
      setIsGeneratingIA(false);
    }
  };

  // Preenche array para ter exatamente 5 itens
  const fillFive = (arr?: string[]) => {
    const list = Array.isArray(arr) ? [...arr] : [];
    while (list.length < 5) {
      list.push('');
    }
    return list.slice(0, 5);
  };

  // Criar Plano Manualmente
  const handleCriarManual = () => {
    setPlanoAtual(createEmptyPlano());
    setActiveDiaIndex(0);
    setSelectedHistoricoId(null);
    setStatusFeedback({
      type: 'info',
      message: 'Plano em branco iniciado. Preencha os campos para os dias da semana.',
    });
  };

  // Atualizar campo de input específico
  const handleInputChange = (
    diaIdx: number,
    refeicaoKey: keyof Refeicoes,
    opcaoIdx: number,
    value: string
  ) => {
    if (!planoAtual) return;
    const novoPlano = { ...planoAtual };
    const dias = [...novoPlano.plano_semanal];
    const diaAlvo = { ...dias[diaIdx] };
    const refeicoesAlvo = { ...diaAlvo.refeicoes };
    const opcoes = [...refeicoesAlvo[refeicaoKey]];
    opcoes[opcaoIdx] = value;
    refeicoesAlvo[refeicaoKey] = opcoes;
    diaAlvo.refeicoes = refeicoesAlvo;
    dias[diaIdx] = diaAlvo;
    novoPlano.plano_semanal = dias;
    setPlanoAtual(novoPlano);
  };

  // Salvar no Neon PostgreSQL
  const handleSalvarPlano = async () => {
    if (!planoAtual || !paciente?.id) return;
    setIsSaving(true);
    setStatusFeedback(null);

    try {
      const res = await salvarPlanoAlimentar(paciente.id, planoAtual);
      if (res.success) {
        setStatusFeedback({
          type: 'success',
          message: 'Plano alimentar salvo com sucesso no prontuário do paciente!',
        });
        await carregarHistorico();
      } else {
        throw new Error(res.error?.message || 'Falha ao salvar no banco');
      }
    } catch (err: any) {
      console.error('Erro ao salvar plano:', err);
      setStatusFeedback({
        type: 'error',
        message: 'Erro ao persistir o plano alimentar no banco de dados. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Carregar plano do histórico na tela
  const handleSelecionarHistorico = (item: PlanoAlimentarItem) => {
    try {
      const parsed = typeof item.conteudo === 'string' ? JSON.parse(item.conteudo) : item.conteudo;
      if (parsed?.plano_semanal) {
        setPlanoAtual(parsed);
        setActiveDiaIndex(0);
        setSelectedHistoricoId(item.id);
        setStatusFeedback({
          type: 'info',
          message: `Visualizando versão salva em ${new Date(item.created_at).toLocaleDateString('pt-BR')} às ${new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Edições podem ser salvas como um novo registro.`,
        });
      }
    } catch (e) {
      console.error('Erro ao abrir plano do histórico:', e);
    }
  };

  const activeDia = planoAtual?.plano_semanal[activeDiaIndex];

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA SEÇÃO COM AÇÕES */}
      <Card className="border-emerald-100 shadow-sm bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm flex-shrink-0">
                  <Utensils className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Plano Alimentar Semanal</h2>
              </div>
              <p className="text-xs text-slate-500">
                Gere cardápios personalizados com IA levando em consideração metas, alergias e preferências do paciente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
              <Button
                onClick={handleCriarManual}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-xs border-slate-300 hover:bg-slate-50 text-slate-700 justify-center"
                disabled={isGeneratingIA || isSaving}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Plano Manual
              </Button>

              <Button
                onClick={handleGerarPlanoIA}
                disabled={isGeneratingIA || isSaving}
                className="w-full sm:w-auto justify-center bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md hover:shadow-lg transition-all text-xs font-semibold px-4 py-2"
              >
                {isGeneratingIA ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Gerando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300 animate-pulse" />
                    ✨ Gerar Plano com IA
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* LOADING COM FEEDBACK DINÂMICO */}
          {isGeneratingIA && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-900/5 border border-emerald-200/80 flex items-center gap-3.5 animate-pulse">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-inner">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-950">{loadingMessage}</p>
                <p className="text-xs text-emerald-700">O Gemini está construindo um cardápio semanal completo adaptado ao paciente.</p>
              </div>
            </div>
          )}

          {/* FEEDBACK STATUS / TOAST INLINE */}
          {statusFeedback && (
            <div
              className={`mt-4 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                statusFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : statusFeedback.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {statusFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />}
              {statusFeedback.type === 'error' && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />}
              {statusFeedback.type === 'info' && <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />}
              <div className="flex-1 flex items-center justify-between gap-2">
                <span>{statusFeedback.message}</span>
                {statusFeedback.type === 'error' && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleGerarPlanoIA}
                      className="underline font-semibold hover:text-rose-950"
                    >
                      Tentar Novamente
                    </button>
                    <span>|</span>
                    <button
                      onClick={handleCriarManual}
                      className="underline font-semibold hover:text-rose-950"
                    >
                      Criar Manual
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ÁREA PRINCIPAL: EDITOR DE PLANO (TABS) & HISTÓRICO */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* COLUNA PRINCIPAL: PLANO GERADO / EDITOR */}
        <div className="lg:col-span-3 space-y-4">
          {planoAtual ? (
            <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
              {/* CABEÇALHO DO EDITOR & BOTÃO DE SALVAR */}
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {selectedHistoricoId ? 'Visualizando Plano Gravado' : 'Editando Novo Plano'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSalvarPlano}
                    disabled={isSaving || isGeneratingIA}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                    size="sm"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {isSaving ? 'Salvando...' : 'Salvar Plano Alimentar'}
                  </Button>
                </div>
              </div>

              {/* TABS DOS DIAS DA SEMANA */}
              <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar bg-slate-100/60 p-1.5 gap-1.5">
                {planoAtual.plano_semanal.map((diaObj, idx) => {
                  const isActive = activeDiaIndex === idx;
                  return (
                    <button
                      key={diaObj.dia || idx}
                      onClick={() => setActiveDiaIndex(idx)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                        isActive
                          ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                          : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                      }`}
                    >
                      <Calendar className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {diaObj.dia}
                    </button>
                  );
                })}
              </div>

              {/* CONTEÚDO DO DIA ATIVO (5 REFEIÇÕES X 5 INPUTS) */}
              <div className="p-4 sm:p-5 space-y-6">
                {activeDia ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                        <span>Cardápio para:</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                          {activeDia.dia}
                        </span>
                      </h3>
                      <span className="text-[11px] text-slate-400">5 opções/alimentos por refeição</span>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      {REFEICOES_CONFIG.map((refeicao) => {
                        const opcoes = activeDia.refeicoes[refeicao.key as keyof Refeicoes] || ['', '', '', '', ''];
                        return (
                          <div
                            key={refeicao.key}
                            className={`p-4 rounded-xl border transition-all ${refeicao.color}`}
                          >
                            <h4 className="text-xs font-extrabold uppercase tracking-wider mb-3 flex items-center justify-between">
                              <span>{refeicao.label}</span>
                              <span className="text-[10px] font-normal opacity-70">Opções 1 a 5</span>
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                              {opcoes.map((opcaoVal, opIdx) => (
                                <div key={opIdx} className="space-y-1">
                                  <label className="text-[10px] font-medium text-slate-500 block">
                                    Item / Opção {opIdx + 1}
                                  </label>
                                  <input
                                    type="text"
                                    value={opcaoVal || ''}
                                    onChange={(e) =>
                                      handleInputChange(
                                        activeDiaIndex,
                                        refeicao.key as keyof Refeicoes,
                                        opIdx,
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Opção ${opIdx + 1}...`}
                                    className="w-full text-xs px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-shadow shadow-2xs"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Nenhum dia selecionado.
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="py-12 px-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                  <Utensils className="w-6 h-6" />
                </div>
                <div className="max-w-sm mx-auto space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">Nenhum plano sendo editado</h3>
                  <p className="text-xs text-slate-500">
                    Clique em <strong className="text-emerald-700">✨ Gerar Plano com IA</strong> para criar um cardápio semanal automaticamente ou selecione uma versão no histórico ao lado.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <Button
                    onClick={handleGerarPlanoIA}
                    disabled={isGeneratingIA}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Gerar com IA agora
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* COLUNA LATERAL: HISTÓRICO DE PLANOS */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-200/80 shadow-sm bg-white">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-600" />
                Histórico de Planos
              </CardTitle>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                {historico.length}
              </span>
            </CardHeader>
            <CardContent className="p-3">
              {isLoadingHistorico ? (
                <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto text-emerald-600" />
                  <p>Carregando histórico...</p>
                </div>
              ) : historico.length === 0 ? (
                <div className="py-6 text-center text-slate-400 space-y-1">
                  <Clock className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Nenhum plano gravado</p>
                  <p className="text-[11px] text-slate-400">Os planos gerados e salvos ficarão listados aqui.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {historico.map((item, idx) => {
                    const isSelected = selectedHistoricoId === item.id;
                    const dateObj = new Date(item.created_at);
                    const formattedDate = dateObj.toLocaleDateString('pt-BR');
                    const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelecionarHistorico(item)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                            : 'border-slate-100 bg-slate-50/40 hover:bg-slate-100/60 hover:border-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">
                              Plano #{historico.length - idx}
                            </span>
                            {idx === 0 && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                Atual
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formattedDate} às {formattedTime}
                          </p>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 text-slate-400 transition-transform group-hover:translate-x-0.5 ${
                            isSelected ? 'text-emerald-600' : ''
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
