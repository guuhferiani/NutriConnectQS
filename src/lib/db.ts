import { neon } from '@neondatabase/serverless';

const databaseUrl = import.meta.env.VITE_DATABASE_URL || '';

export const sql = neon(databaseUrl);

/**
 * Garante a sincronização do nutricionista na tabela public.nutricionistas.
 * O trigger `on_neon_auth_user_created` no Neon já faz isso automaticamente,
 * mas esta função assegura consistência também a nível de aplicação.
 */
export async function syncNutricionista(id: string, nome: string, email: string) {
  try {
    const result = await sql`
      INSERT INTO public.nutricionistas (id, nome, email, created_at)
      VALUES (${id}, ${nome}, ${email}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE
      SET nome = EXCLUDED.nome, email = EXCLUDED.email
      RETURNING id, nome, email, created_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.warn('Sincronização via SQL direto:', error);
    return { success: false, error };
  }
}

export async function getNutricionista(id: string) {
  try {
    const result = await sql`
      SELECT id, nome, email, created_at 
      FROM public.nutricionistas 
      WHERE id = ${id} 
      LIMIT 1;
    `;
    return result[0] || null;
  } catch (error) {
    console.warn('Erro ao buscar nutricionista no PostgreSQL:', error);
    return null;
  }
}

export interface PacienteSemRetorno {
  id: string;
  nome: string;
  whatsapp?: string | null;
  email?: string | null;
  ultima_consulta: string;
  proximo_retorno?: string | null;
  dias_sem_consulta: number;
}

export interface DashboardMetrics {
  totalPacientes: number;
  consultasSemana: number;
  pacientesSemRetorno: PacienteSemRetorno[];
}

/**
 * Carrega as métricas do Dashboard em tempo real diretamente do Neon:
 * - Card 1: Total de pacientes cadastrados pela nutricionista logada
 * - Card 2: Consultas registradas na semana atual
 * - Card 3: Pacientes cuja última consulta foi há mais de 30 dias e sem próximo retorno agendado
 */
export async function getDashboardMetrics(nutricionistaId: string): Promise<DashboardMetrics> {
  try {
    // 1. Total de pacientes cadastrados pelo nutricionista logado
    const totalPacientesQuery = sql`
      SELECT COUNT(*)::int as total
      FROM public.pacientes
      WHERE nutricionista_id = ${nutricionistaId};
    `;

    // 2. Consultas da semana atual (da segunda-feira da semana corrente até o domingo)
    const consultasSemanaQuery = sql`
      SELECT COUNT(*)::int as total
      FROM public.consultas c
      JOIN public.pacientes p ON p.id = c.paciente_id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
        AND c.data_consulta < (date_trunc('week', CURRENT_DATE) + interval '1 week')::date;
    `;

    // 3. Pacientes cuja última consulta foi há mais de 30 dias e sem retorno agendado
    const pacientesSemRetornoQuery = sql`
      WITH ultimas_consultas AS (
        SELECT DISTINCT ON (c.paciente_id)
          c.paciente_id,
          c.data_consulta,
          c.proximo_retorno
        FROM public.consultas c
        JOIN public.pacientes p ON p.id = c.paciente_id
        WHERE p.nutricionista_id = ${nutricionistaId}
        ORDER BY c.paciente_id, c.data_consulta DESC, c.created_at DESC
      )
      SELECT 
        p.id,
        p.nome,
        p.whatsapp,
        p.email,
        uc.data_consulta as ultima_consulta,
        uc.proximo_retorno,
        (CURRENT_DATE - uc.data_consulta)::int as dias_sem_consulta
      FROM public.pacientes p
      JOIN ultimas_consultas uc ON uc.paciente_id = p.id
      WHERE p.nutricionista_id = ${nutricionistaId}
        AND uc.data_consulta < (CURRENT_DATE - INTERVAL '30 days')
        AND (uc.proximo_retorno IS NULL OR uc.proximo_retorno < CURRENT_DATE)
      ORDER BY uc.data_consulta ASC;
    `;

    const [totalPacientesRes, consultasSemanaRes, pacientesSemRetornoRes] = await Promise.all([
      totalPacientesQuery,
      consultasSemanaQuery,
      pacientesSemRetornoQuery,
    ]);

    return {
      totalPacientes: Number(totalPacientesRes[0]?.total ?? 0),
      consultasSemana: Number(consultasSemanaRes[0]?.total ?? 0),
      pacientesSemRetorno: (pacientesSemRetornoRes as any[]).map((row) => ({
        id: row.id,
        nome: row.nome,
        whatsapp: row.whatsapp,
        email: row.email,
        ultima_consulta: row.ultima_consulta,
        proximo_retorno: row.proximo_retorno,
        dias_sem_consulta: Number(row.dias_sem_consulta || 0),
      })),
    };
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard no Neon:', error);
    throw error;
  }
}

export interface PacienteItem {
  id: string;
  nutricionista_id: string;
  nome: string;
  email?: string | null;
  whatsapp?: string | null;
  data_nascimento?: string | null;
  sexo?: string | null;
  objetivo_texto?: string | null;
  objetivos?: string[] | null;
  ultima_consulta?: string | null;
  created_at: string;
}

export interface NovoPacienteData {
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string | null;
  sexo?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  peso_inicial?: number | null;
  altura?: number | null;
  objetivos?: string[] | null;
  objetivo_texto?: string | null;
  nivel_atividade?: string | null;
  patologias?: string[] | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string[] | null;
  medicamentos?: string | null;
  suplementos?: string | null;
  refeicoes_por_dia?: number | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
  litros_agua?: number | null;
  atividade_fisica?: boolean | null;
  atividade_fisica_descricao?: string | null;
  observacoes?: string | null;
}

export async function getPacientes(nutricionistaId: string): Promise<PacienteItem[]> {
  try {
    const result = await sql`
      SELECT 
        p.id, 
        p.nutricionista_id, 
        p.nome, 
        p.email, 
        p.whatsapp, 
        p.data_nascimento, 
        p.sexo, 
        p.objetivo_texto,
        p.objetivos,
        p.created_at,
        (
          SELECT c.data_consulta 
          FROM public.consultas c 
          WHERE c.paciente_id = p.id 
          ORDER BY c.data_consulta DESC 
          LIMIT 1
        ) as ultima_consulta
      FROM public.pacientes p
      WHERE p.nutricionista_id = ${nutricionistaId}
      ORDER BY p.nome ASC;
    `;
    return result as any as PacienteItem[];
  } catch (error) {
    console.error('Erro ao listar pacientes no Neon:', error);
    return [];
  }
}

export async function criarPaciente(dados: NovoPacienteData): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const result = await sql`
      INSERT INTO public.pacientes (
        nutricionista_id,
        nome,
        data_nascimento,
        sexo,
        whatsapp,
        email,
        peso_inicial,
        altura,
        objetivos,
        objetivo_texto,
        nivel_atividade,
        patologias,
        restricoes_alimentares,
        alergias,
        medicamentos,
        suplementos,
        refeicoes_por_dia,
        horario_acorda,
        horario_dorme,
        litros_agua,
        atividade_fisica,
        atividade_fisica_descricao,
        observacoes,
        created_at
      ) VALUES (
        ${dados.nutricionista_id},
        ${dados.nome},
        ${dados.data_nascimento || null},
        ${dados.sexo || null},
        ${dados.whatsapp || null},
        ${dados.email || null},
        ${dados.peso_inicial ?? null},
        ${dados.altura ?? null},
        ${dados.objetivos || null},
        ${dados.objetivo_texto || null},
        ${dados.nivel_atividade || null},
        ${dados.patologias || null},
        ${dados.restricoes_alimentares || null},
        ${dados.alergias || null},
        ${dados.medicamentos || null},
        ${dados.suplementos || null},
        ${dados.refeicoes_por_dia ?? null},
        ${dados.horario_acorda || null},
        ${dados.horario_dorme || null},
        ${dados.litros_agua ?? null},
        ${dados.atividade_fisica ?? null},
        ${dados.atividade_fisica_descricao || null},
        ${dados.observacoes || null},
        CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;
    return { success: true, data: result[0] };
  } catch (error: any) {
    console.error('Erro ao cadastrar paciente no Neon:', error);
    return { success: false, error };
  }
}

export interface AtualizarPacienteData {
  nome: string;
  data_nascimento?: string | null;
  sexo?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  peso_inicial?: number | null;
  altura?: number | null;
  objetivos?: string[] | null;
  objetivo_texto?: string | null;
  nivel_atividade?: string | null;
  patologias?: string[] | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string[] | null;
  medicamentos?: string | null;
  suplementos?: string | null;
  refeicoes_por_dia?: number | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
  litros_agua?: number | null;
  atividade_fisica?: boolean | null;
  atividade_fisica_descricao?: string | null;
  observacoes?: string | null;
}

export async function atualizarPaciente(id: string, nutricionistaId: string, dados: AtualizarPacienteData): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const result = await sql`
      UPDATE public.pacientes
      SET
        nome = ${dados.nome},
        data_nascimento = ${dados.data_nascimento || null},
        sexo = ${dados.sexo || null},
        whatsapp = ${dados.whatsapp || null},
        email = ${dados.email || null},
        peso_inicial = ${dados.peso_inicial ?? null},
        altura = ${dados.altura ?? null},
        objetivos = ${dados.objetivos || null},
        objetivo_texto = ${dados.objetivo_texto || null},
        nivel_atividade = ${dados.nivel_atividade || null},
        patologias = ${dados.patologias || null},
        restricoes_alimentares = ${dados.restricoes_alimentares || null},
        alergias = ${dados.alergias || null},
        medicamentos = ${dados.medicamentos || null},
        suplementos = ${dados.suplementos || null},
        refeicoes_por_dia = ${dados.refeicoes_por_dia ?? null},
        horario_acorda = ${dados.horario_acorda || null},
        horario_dorme = ${dados.horario_dorme || null},
        litros_agua = ${dados.litros_agua ?? null},
        atividade_fisica = ${dados.atividade_fisica ?? null},
        atividade_fisica_descricao = ${dados.atividade_fisica_descricao || null},
        observacoes = ${dados.observacoes || null}
      WHERE id = ${id} AND nutricionista_id = ${nutricionistaId}
      RETURNING *;
    `;
    return { success: true, data: result[0] };
  } catch (error: any) {
    console.error('Erro ao atualizar paciente no Neon:', error);
    return { success: false, error };
  }
}

export interface ConsultaItem {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso?: number | null;
  cintura?: number | null;
  quadril?: number | null;
  percentual_gordura?: number | null;
  observacoes?: string | null;
  proximo_retorno?: string | null;
  created_at: string;
}

export interface NovaConsultaData {
  paciente_id: string;
  data_consulta: string;
  peso?: number | null;
  cintura?: number | null;
  quadril?: number | null;
  percentual_gordura?: number | null;
  observacoes?: string | null;
  proximo_retorno?: string | null;
}

export async function getConsultasByPaciente(pacienteId: string): Promise<ConsultaItem[]> {
  try {
    const result = await sql`
      SELECT 
        id, 
        paciente_id, 
        data_consulta, 
        peso, 
        cintura, 
        quadril, 
        percentual_gordura, 
        observacoes, 
        proximo_retorno, 
        created_at
      FROM public.consultas
      WHERE paciente_id = ${pacienteId}
      ORDER BY data_consulta DESC, created_at DESC;
    `;
    return (result as any[]).map(row => ({
      ...row,
      peso: row.peso !== null && row.peso !== undefined ? Number(row.peso) : null,
      cintura: row.cintura !== null && row.cintura !== undefined ? Number(row.cintura) : null,
      quadril: row.quadril !== null && row.quadril !== undefined ? Number(row.quadril) : null,
      percentual_gordura: row.percentual_gordura !== null && row.percentual_gordura !== undefined ? Number(row.percentual_gordura) : null,
    }));
  } catch (error) {
    console.error('Erro ao buscar consultas no Neon:', error);
    return [];
  }
}

export async function criarConsulta(dados: NovaConsultaData): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const result = await sql`
      INSERT INTO public.consultas (
        paciente_id,
        data_consulta,
        peso,
        cintura,
        quadril,
        percentual_gordura,
        observacoes,
        proximo_retorno,
        created_at
      ) VALUES (
        ${dados.paciente_id},
        ${dados.data_consulta},
        ${dados.peso ?? null},
        ${dados.cintura ?? null},
        ${dados.quadril ?? null},
        ${dados.percentual_gordura ?? null},
        ${dados.observacoes || null},
        ${dados.proximo_retorno || null},
        CURRENT_TIMESTAMP
      )
      RETURNING *;
    `;
    return { success: true, data: result[0] };
  } catch (error: any) {
    console.error('Erro ao registrar consulta no Neon:', error);
    return { success: false, error };
  }
}

export async function getPacienteById(id: string, nutricionistaId: string) {
  try {
    const result = await sql`
      SELECT *
      FROM public.pacientes
      WHERE id = ${id} AND nutricionista_id = ${nutricionistaId}
      LIMIT 1;
    `;
    return result[0] || null;
  } catch (error) {
    console.error('Erro ao buscar paciente no Neon:', error);
    return null;
  }
}



export interface PlanoAlimentarItem {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string;
}

export async function getPlanosAlimentaresByPaciente(pacienteId: string): Promise<PlanoAlimentarItem[]> {
  try {
    const result = await sql`
      SELECT id, paciente_id, conteudo, created_at
      FROM public.planos_alimentares
      WHERE paciente_id = ${pacienteId}
      ORDER BY created_at DESC;
    `;
    return result as any as PlanoAlimentarItem[];
  } catch (error) {
    console.error('Erro ao buscar planos alimentares no Neon:', error);
    return [];
  }
}

export async function salvarPlanoAlimentar(pacienteId: string, conteudo: any): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const conteudoJson = typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo);
    const result = await sql`
      INSERT INTO public.planos_alimentares (paciente_id, conteudo, created_at)
      VALUES (${pacienteId}, ${conteudoJson}::jsonb, CURRENT_TIMESTAMP)
      RETURNING id, paciente_id, conteudo, created_at;
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Erro ao salvar plano alimentar no Neon:', error);
    return { success: false, error };
  }
}


