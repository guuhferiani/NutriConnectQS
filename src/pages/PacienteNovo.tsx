import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { criarPaciente, NovoPacienteData } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  User,
  Activity,
  Coffee,
  ArrowLeft,
  Save,
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

export const PacienteNovo: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Aba 1 - Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba 2 - Clínico
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  
  const [patologias, setPatologias] = useState<string[]>([]);
  const [novaPatologia, setNovaPatologia] = useState('');
  
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [novaRestricao, setNovaRestricao] = useState('');

  const [alergias, setAlergias] = useState<string[]>([]);
  const [novaAlergia, setNovaAlergia] = useState('');

  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Aba 3 - Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [praticaAtividade, setPraticaAtividade] = useState<'sim' | 'nao' | ''>('');
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Formatar Horário (ex: 6 -> 06:00, 630 -> 06:30, 23 -> 23:00)
  const formatTime = (input: string): string => {
    const clean = input.replace(/\D/g, '');
    if (!clean) return '';
    if (clean.length === 1) return `0${clean}:00`;
    if (clean.length === 2) {
      const num = parseInt(clean, 10);
      if (num < 24) return `${clean}:00`;
      return `${clean.slice(0, 1)}:0${clean.slice(1)}`;
    }
    if (clean.length === 3) {
      return `0${clean.slice(0, 1)}:${clean.slice(1, 3)}`;
    }
    return `${clean.slice(0, 2)}:${clean.slice(2, 4)}`;
  };

  const handleTimeBlur = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!value) return;
    if (value.includes(':')) return;
    setter(formatTime(value));
  };

  // Formatar Telefone / WhatsApp (99) 99999-9999
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    if (v.length > 9) v = `${v.slice(0, 10)}-${v.slice(10)}`;
    setWhatsapp(v);
  };

  // Calcular Idade
  const calcularIdade = (dataNasc: string): number | null => {
    if (!dataNasc) return null;
    const nasc = new Date(dataNasc);
    if (isNaN(nasc.getTime())) return null;
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
  };

  // Calcular IMC
  const pesoNum = parseFloat(peso.replace(',', '.'));
  const alturaNum = parseFloat(altura.replace(',', '.'));
  let imc: string | null = null;
  let imcClassificacao = '';
  if (pesoNum > 0 && alturaNum > 0) {
    // Altura em metros (se digitado em cm, converte)
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

  // Toggle Múltipla Escolha
  const toggleArrayItem = (
    item: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (item === 'Nenhum') {
      if (list.includes('Nenhum')) {
        setter([]);
      } else {
        setter(['Nenhum']);
      }
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


  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMessage('O nome completo do paciente é obrigatório.');
      setActiveTab('pessoal');
      return;
    }

    if (!user?.id) {
      setErrorMessage('Nutricionista não autenticada. Faça login novamente.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const dadosParaSalvar: NovoPacienteData = {
      nutricionista_id: user.id,
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

    try {
      const res = await criarPaciente(dadosParaSalvar);
      if (res.success && res.data?.id) {
        navigate(`/pacientes/${res.data.id}`);
      } else {
        throw new Error(res.error?.message || 'Erro ao registrar no banco de dados.');
      }
    } catch (err: any) {
      console.error('Erro ao salvar paciente:', err);
      setErrorMessage(err?.message || 'Falha ao salvar paciente. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const idadeCalculada = calcularIdade(dataNascimento);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/pacientes')}
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar para Pacientes
        </button>
      </div>

      {/* Título */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Cadastrar Novo Paciente
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Preencha os dados de anamnese do paciente para acompanhamento e geração de cardápios.
        </p>
      </div>

      {/* Feedback de Erro */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Abas de Navegação */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'pessoal'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Pessoal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'clinico'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Clínico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'habitos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>3. Hábitos</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            {/* ABA 1: PESSOAL */}
            {activeTab === 'pessoal' && (
              <div className="space-y-5">
                <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  Informações Pessoais
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Maria Silva Oliveira"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Data de Nascimento</span>
                      {idadeCalculada !== null && (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                          {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sexo</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Feminino', 'Masculino', 'Outro'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setSexo(item)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                            sexo === item
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      WhatsApp / Telefone
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={handleWhatsappChange}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="paciente@exemplo.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: CLÍNICO */}
            {activeTab === 'clinico' && (
              <div className="space-y-6">
                <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Dados Clínicos e Antropométricos
                </h2>

                {/* Medidas & IMC */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Peso Atual
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        placeholder="70.5"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        kg
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Altura
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        value={altura}
                        onChange={(e) => setAltura(e.target.value)}
                        placeholder="175"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        cm
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IMC Calculado
                    </label>
                    <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold flex items-center justify-between">
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
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Objetivo Principal / Metas
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OBJETIVOS_LIST.map((obj) => {
                      const isSel = objetivosSelecionados.includes(obj);
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => toggleArrayItem(obj, objetivosSelecionados, setObjetivosSelecionados)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSel
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
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
                    placeholder="Outro objetivo ou observação de metas..."
                    className="w-full px-3.5 py-2 mt-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>

                {/* Nível de Atividade Física */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nível de Atividade Física
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {NIVEIS_ATIVIDADE.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setNivelAtividade(item)}
                        className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                          nivelAtividade === item
                            ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patologias */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Patologias ou Condições de Saúde
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleArrayItem('Nenhum', patologias, setPatologias)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        patologias.includes('Nenhum')
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Nenhum
                    </button>
                    {PATOLOGIAS_LIST.map((item) => {
                      const isSel = patologias.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleArrayItem(item, patologias, setPatologias)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSel
                              ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs font-bold'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  {/* Custom Patologias */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={novaPatologia}
                      onChange={(e) => setNovaPatologia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustom(novaPatologia, patologias, setPatologias, () => setNovaPatologia(''));
                        }
                      }}
                      placeholder="Adicionar outra patologia..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCustom(novaPatologia, patologias, setPatologias, () => setNovaPatologia(''))}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Restrições Alimentares */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Restrições Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleArrayItem('Nenhum', restricoes, setRestricoes)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        restricoes.includes('Nenhum')
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Nenhum
                    </button>
                    {RESTRICOES_LIST.map((item) => {
                      const isSel = restricoes.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleArrayItem(item, restricoes, setRestricoes)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSel
                              ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs font-bold'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={novaRestricao}
                      onChange={(e) => setNovaRestricao(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustom(novaRestricao, restricoes, setRestricoes, () => setNovaRestricao(''));
                        }
                      }}
                      placeholder="Adicionar outra restrição..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCustom(novaRestricao, restricoes, setRestricoes, () => setNovaRestricao(''))}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Alergias Alimentares */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Alergias Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleArrayItem('Nenhum', alergias, setAlergias)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        alergias.includes('Nenhum')
                          ? 'bg-slate-800 border-slate-800 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Nenhum
                    </button>
                    {ALERGIAS_LIST.map((item) => {
                      const isSel = alergias.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleArrayItem(item, alergias, setAlergias)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSel
                              ? 'bg-red-50 border-red-500 text-red-900 shadow-xs font-bold'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={novaAlergia}
                      onChange={(e) => setNovaAlergia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustom(novaAlergia, alergias, setAlergias, () => setNovaAlergia(''));
                        }
                      }}
                      placeholder="Adicionar outra alergia..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCustom(novaAlergia, alergias, setAlergias, () => setNovaAlergia(''))}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Medicamentos e Suplementos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Medicamentos Contínuos
                    </label>
                    <textarea
                      rows={2}
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                      placeholder="Ex: Losartana 50mg, Metformina 850mg..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Suplementos em Uso
                    </label>
                    <textarea
                      rows={2}
                      value={suplementos}
                      onChange={(e) => setSuplementos(e.target.value)}
                      placeholder="Ex: Whey Protein, Creatina, Vitamina D..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: HÁBITOS */}
            {activeTab === 'habitos' && (
              <div className="space-y-6">
                <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-emerald-600" />
                  Hábitos Diários e Rotina
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Refeições / Dia
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={refeicoesPorDia}
                      onChange={(e) => setRefeicoesPorDia(e.target.value)}
                      placeholder="Ex: 5"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Horário que Acorda
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={horarioAcorda}
                        onChange={(e) => setHorarioAcorda(e.target.value)}
                        onBlur={(e) => handleTimeBlur(e.target.value, setHorarioAcorda)}
                        placeholder="Ex: 06:30 ou 630"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Horário que Dorme
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={horarioDorme}
                        onChange={(e) => setHorarioDorme(e.target.value)}
                        onBlur={(e) => handleTimeBlur(e.target.value, setHorarioDorme)}
                        placeholder="Ex: 23:00 ou 23"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Água por Dia
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={litrosAgua}
                        onChange={(e) => setLitrosAgua(e.target.value)}
                        placeholder="Ex: 2.5"
                        className="w-full px-3.5 py-2.5 pr-14 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        litros
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pratica Atividade Física */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Pratica Atividade Física?
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPraticaAtividade('sim')}
                      className={`py-2 px-5 rounded-xl text-xs font-semibold border transition-all ${
                        praticaAtividade === 'sim'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
                      className={`py-2 px-5 rounded-xl text-xs font-semibold border transition-all ${
                        praticaAtividade === 'nao'
                          ? 'bg-slate-100 border-slate-400 text-slate-800 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Não
                    </button>
                  </div>

                  {praticaAtividade === 'sim' && (
                    <div className="pt-2 animate-fadeIn">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Qual atividade e frequência semanal?
                      </label>
                      <input
                        type="text"
                        value={atividadeDescricao}
                        onChange={(e) => setAtividadeDescricao(e.target.value)}
                        placeholder="Ex: Musculação 4x na semana + Corrida aos sábados"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Observações Gerais */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações Gerais / Anamnese
                  </label>
                  <textarea
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Histórico familiar, preferências no paladar, horários de trabalho, rotina de finais de semana..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Barra de Ações Inferior */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            {activeTab !== 'pessoal' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (activeTab === 'habitos') setActiveTab('clinico');
                  else if (activeTab === 'clinico') setActiveTab('pessoal');
                }}
              >
                Aba Anterior
              </Button>
            )}

            {activeTab !== 'habitos' && (
              <Button
                type="button"
                variant="outline"
                className="bg-slate-50"
                onClick={() => {
                  if (activeTab === 'pessoal') setActiveTab('clinico');
                  else if (activeTab === 'clinico') setActiveTab('habitos');
                }}
              >
                Próxima Aba
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/pacientes')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-semibold px-6"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Cadastrando Paciente...' : 'Salvar e Ver Prontuário'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
