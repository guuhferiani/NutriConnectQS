import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AtualizarPacienteData } from '@/lib/db';
import {
  User,
  Activity,
  Coffee,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';

const OBJETIVOS_LIST = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
];

const PATOLOGIAS_LIST = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const RESTRICOES_LIST = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const ALERGIAS_LIST = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

interface PacienteDadosEditSectionProps {
  paciente: any;
  onSalvar: (dados: AtualizarPacienteData) => Promise<{ success: boolean; error?: any }>;
}

export const PacienteDadosEditSection: React.FC<PacienteDadosEditSectionProps> = ({
  paciente,
  onSalvar,
}) => {
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Aba 1 - Pessoal
  const [nome, setNome] = useState(paciente.nome || '');
  const [dataNascimento, setDataNascimento] = useState(paciente.data_nascimento || '');
  const [sexo, setSexo] = useState(paciente.sexo || '');
  const [whatsapp, setWhatsapp] = useState(paciente.whatsapp || '');
  const [email, setEmail] = useState(paciente.email || '');

  // Aba 2 - Clínico
  const [peso, setPeso] = useState(paciente.peso_inicial ? String(paciente.peso_inicial) : '');
  const [altura, setAltura] = useState(paciente.altura ? String(paciente.altura) : '');
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>(
    Array.isArray(paciente.objetivos) ? paciente.objetivos : []
  );
  const [objetivoTexto, setObjetivoTexto] = useState(paciente.objetivo_texto || '');
  const [nivelAtividade, setNivelAtividade] = useState(paciente.nivel_atividade || '');
  const [patologias, setPatologias] = useState<string[]>(
    Array.isArray(paciente.patologias) ? paciente.patologias : []
  );
  const [novaPatologia, setNovaPatologia] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>(
    Array.isArray(paciente.restricoes_alimentares) ? paciente.restricoes_alimentares : []
  );
  const [novaRestricao, setNovaRestricao] = useState('');
  const [alergias, setAlergias] = useState<string[]>(
    Array.isArray(paciente.alergias) ? paciente.alergias : []
  );
  const [novaAlergia, setNovaAlergia] = useState('');
  const [medicamentos, setMedicamentos] = useState(paciente.medicamentos || '');
  const [suplementos, setSuplementos] = useState(paciente.suplementos || '');

  // Aba 3 - Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState(
    paciente.refeicoes_por_dia ? String(paciente.refeicoes_por_dia) : ''
  );
  const [horarioAcorda, setHorarioAcorda] = useState(paciente.horario_acorda || '');
  const [horarioDorme, setHorarioDorme] = useState(paciente.horario_dorme || '');
  const [litrosAgua, setLitrosAgua] = useState(
    paciente.litros_agua ? String(paciente.litros_agua) : ''
  );
  const [praticaAtividade, setPraticaAtividade] = useState<'sim' | 'nao' | ''>(
    paciente.atividade_fisica === true ? 'sim' : paciente.atividade_fisica === false ? 'nao' : ''
  );
  const [atividadeDescricao, setAtividadeDescricao] = useState(
    paciente.atividade_fisica_descricao || ''
  );
  const [observacoes, setObservacoes] = useState(paciente.observacoes || '');

  // Formatar Horário (ex: 6 -> 06:00, 630 -> 06:30)
  const formatTime = (input: string): string => {
    const clean = input.replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 1) return `0${clean}:00`;
    if (clean.length === 2) {
      const num = parseInt(clean, 10);
      if (num < 24) return `${clean}:00`;
      return `${clean.slice(0, 1)}:0${clean.slice(1)}`;
    }
    if (clean.length === 3) return `0${clean.slice(0, 1)}:${clean.slice(1, 3)}`;
    return `${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
  };

  const handleTimeBlur = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!value || value.includes(':')) return;
    setter(formatTime(value));
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length > 9) v = `${v.slice(0, 10)}-${v.slice(10)}`;
    setWhatsapp(v);
  };

  const calcularIdade = (dataNasc: string): number | null => {
    if (!dataNasc) return null;
    const nasc = new Date(dataNasc);
    if (isNaN(nasc.getTime())) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const pesoNum = parseFloat(peso.replace(',', '.'));
  const alturaNum = parseFloat(altura.replace(',', '.'));
  let imc: string | null = null;
  let imcClassificacao = '';
  if (pesoNum > 0 && alturaNum > 0) {
    const alturaMetros = alturaNum > 3 ? alturaNum / 100 : alturaNum;
    const imcValor = pesoNum / (alturaMetros * alturaMetros);
    imc = imcValor.toFixed(1);
    if (imcValor < 18.5) imcClassificacao = 'Abaixo do peso';
    else if (imcValor < 25) imcClassificacao = 'Peso adequado';
    else if (imcValor < 30) imcClassificacao = 'Sobrepeso';
    else if (imcValor < 35) imcClassificacao = 'Obesidade Grau I';
    else if (imcValor < 40) imcClassificacao = 'Obesidade Grau II';
    else imcClassificacao = 'Obesidade Grau III';
  }

  const toggleArrayItem = (
    item: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (item === 'Nenhum') {
      if (list.includes('Nenhum')) setter([]);
      else setter(['Nenhum']);
      return;
    }
    const cleanList = list.filter((i) => i !== 'Nenhum');
    if (cleanList.includes(item)) {
      setter(cleanList.filter((i) => i !== item));
    } else {
      setter([...cleanList, item]);
    }
  };

  const handleAddCustom = (
    item: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputReset: () => void
  ) => {
    if (!item.trim()) return;
    const cleanList = list.filter((i) => i !== 'Nenhum');
    if (!cleanList.includes(item.trim())) {
      setter([...cleanList, item.trim()]);
    }
    inputReset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setFeedback({ type: 'error', message: 'O nome completo do paciente é obrigatório.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const dadosAtualizados: AtualizarPacienteData = {
      nome: nome.trim(),
      data_nascimento: dataNascimento || null,
      sexo: sexo || null,
      whatsapp: whatsapp || null,
      email: email.trim() || null,
      peso_inicial: pesoNum > 0 ? pesoNum : null,
      altura: alturaNum > 0 ? (alturaNum > 3 ? alturaNum : alturaNum * 100) : null,
      objetivos: objetivosSelecionados.length > 0 ? objetivosSelecionados : null,
      objetivo_texto: objetivoTexto.trim() || null,
      nivel_atividade: nivelAtividade || null,
      patologias: patologias.length > 0 ? patologias : null,
      restricoes_alimentares: restricoes.length > 0 ? restricoes : null,
      alergias: alergias.length > 0 ? alergias : null,
      medicamentos: medicamentos.trim() || null,
      suplementos: suplementos.trim() || null,
      refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null,
      horario_acorda: horarioAcorda || null,
      horario_dorme: horarioDorme || null,
      litros_agua: litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : null,
      atividade_fisica: praticaAtividade === 'sim' ? true : praticaAtividade === 'nao' ? false : null,
      atividade_fisica_descricao: praticaAtividade === 'sim' ? atividadeDescricao.trim() : null,
      observacoes: observacoes.trim() || null,
    };

    const res = await onSalvar(dadosAtualizados);
    setIsSaving(false);

    if (res.success) {
      setFeedback({ type: 'success', message: 'Dados do paciente atualizados com sucesso no banco!' });
    } else {
      setFeedback({ type: 'error', message: res.error?.message || 'Falha ao salvar alterações.' });
    }
  };

  const idadeCalculada = calcularIdade(dataNascimento);

  return (
    <div className="space-y-4">
      {/* ABAS DA ANAMNESE */}
      <div className="grid grid-cols-3 bg-white border border-slate-200/90 rounded-xl p-1 shadow-xs gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`py-2 px-1 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-all min-w-0 ${
            activeTab === 'pessoal'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate">1. Pessoal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`py-2 px-1 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-all min-w-0 ${
            activeTab === 'clinico'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate">2. Clínico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`py-2 px-1 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-all min-w-0 ${
            activeTab === 'habitos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate">3. Hábitos</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            {/* ABA 1 - PESSOAL */}
            {activeTab === 'pessoal' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Data de Nascimento</span>
                      {idadeCalculada !== null && (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                          {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sexo</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Feminino', 'Masculino', 'Outro'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setSexo(item)}
                          className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
                            sexo === item
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      WhatsApp / Telefone
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={handleWhatsappChange}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2 - CLÍNICO */}
            {activeTab === 'clinico' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Peso Atual / Inicial
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        kg
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Altura</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={altura}
                        onChange={(e) => setAltura(e.target.value)}
                        className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        cm
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">IMC</label>
                    <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold flex items-center justify-between">
                      <span className="text-slate-800">{imc ? `${imc} kg/m²` : '—'}</span>
                      {imcClassificacao && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {imcClassificacao}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Objetivo</label>
                  <div className="flex flex-wrap gap-1.5">
                    {OBJETIVOS_LIST.map((obj) => {
                      const isSel = objetivosSelecionados.includes(obj);
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => toggleArrayItem(obj, objetivosSelecionados, setObjetivosSelecionados)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            isSel
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {obj}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={objetivoTexto}
                    onChange={(e) => setObjetivoTexto(e.target.value)}
                    placeholder="Outro objetivo ou complemento..."
                    className="w-full px-3 py-1.5 mt-1 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                {/* Nível de Atividade */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nível de Atividade Física
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {NIVEIS_ATIVIDADE.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setNivelAtividade(item)}
                        className={`py-1.5 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                          nivelAtividade === item
                            ? 'bg-teal-50 border-teal-600 text-teal-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patologias */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Patologias</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleArrayItem('Nenhum', patologias, setPatologias)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        patologias.includes('Nenhum')
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Nenhum
                    </button>
                    {PATOLOGIAS_LIST.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem(item, patologias, setPatologias)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          patologias.includes(item)
                            ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={novaPatologia}
                      onChange={(e) => setNovaPatologia(e.target.value)}
                      placeholder="Adicionar patologia..."
                      className="flex-1 px-3 py-1 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCustom(novaPatologia, patologias, setPatologias, () => setNovaPatologia(''))}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                {/* Restrições & Alergias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Restrições</label>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => toggleArrayItem('Nenhum', restricoes, setRestricoes)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          restricoes.includes('Nenhum') ? 'bg-slate-800 text-white' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Nenhum
                      </button>
                      {RESTRICOES_LIST.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleArrayItem(item, restricoes, setRestricoes)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            restricoes.includes(item) ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        value={novaRestricao}
                        onChange={(e) => setNovaRestricao(e.target.value)}
                        placeholder="Outra restrição..."
                        className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:border-emerald-600"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-[11px] px-2 py-1 h-auto"
                        onClick={() => handleAddCustom(novaRestricao, restricoes, setRestricoes, () => setNovaRestricao(''))}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Alergias</label>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => toggleArrayItem('Nenhum', alergias, setAlergias)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          alergias.includes('Nenhum') ? 'bg-slate-800 text-white' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Nenhum
                      </button>
                      {ALERGIAS_LIST.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleArrayItem(item, alergias, setAlergias)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            alergias.includes(item) ? 'bg-red-50 border-red-500 text-red-900 font-bold' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        value={novaAlergia}
                        onChange={(e) => setNovaAlergia(e.target.value)}
                        placeholder="Outra alergia..."
                        className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:border-emerald-600"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-[11px] px-2 py-1 h-auto"
                        onClick={() => handleAddCustom(novaAlergia, alergias, setAlergias, () => setNovaAlergia(''))}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Medicamentos</label>
                    <input
                      type="text"
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                      placeholder="Medicamentos de uso contínuo..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Suplementos</label>
                    <input
                      type="text"
                      value={suplementos}
                      onChange={(e) => setSuplementos(e.target.value)}
                      placeholder="Suplementos em uso..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3 - HÁBITOS */}
            {activeTab === 'habitos' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Refeições / Dia</label>
                    <input
                      type="number"
                      value={refeicoesPorDia}
                      onChange={(e) => setRefeicoesPorDia(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Horário Acorda</label>
                    <input
                      type="text"
                      value={horarioAcorda}
                      onChange={(e) => setHorarioAcorda(e.target.value)}
                      onBlur={(e) => handleTimeBlur(e.target.value, setHorarioAcorda)}
                      placeholder="06:30"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Horário Dorme</label>
                    <input
                      type="text"
                      value={horarioDorme}
                      onChange={(e) => setHorarioDorme(e.target.value)}
                      onBlur={(e) => handleTimeBlur(e.target.value, setHorarioDorme)}
                      placeholder="23:00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Água / Dia</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={litrosAgua}
                        onChange={(e) => setLitrosAgua(e.target.value)}
                        placeholder="2.5"
                        className="w-full px-3 py-2 pr-12 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                        litros
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Pratica Atividade Física?</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPraticaAtividade('sim')}
                      className={`py-1.5 px-4 rounded-xl text-xs font-semibold border ${
                        praticaAtividade === 'sim' ? 'bg-emerald-50 border-emerald-600 text-emerald-800' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPraticaAtividade('nao');
                        setAtividadeDescricao('');
                      }}
                      className={`py-1.5 px-4 rounded-xl text-xs font-semibold border ${
                        praticaAtividade === 'nao' ? 'bg-slate-100 border-slate-400 text-slate-800' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Não
                    </button>
                  </div>

                  {praticaAtividade === 'sim' && (
                    <input
                      type="text"
                      value={atividadeDescricao}
                      onChange={(e) => setAtividadeDescricao(e.target.value)}
                      placeholder="Qual atividade e frequência semanal..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Gerais</label>
                  <textarea
                    rows={2}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* BOTÃO SALVAR ALTERAÇÕES */}
        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? 'Salvando alterações...' : 'Salvar Alterações do Paciente'}
          </Button>
        </div>
      </form>
    </div>
  );
};
