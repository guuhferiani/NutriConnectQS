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
  created_at: string;
}

export async function getPacientes(nutricionistaId: string): Promise<PacienteItem[]> {
  try {
    const result = await sql`
      SELECT id, nutricionista_id, nome, email, whatsapp, data_nascimento, sexo, created_at
      FROM public.pacientes
      WHERE nutricionista_id = ${nutricionistaId}
      ORDER BY nome ASC;
    `;
    return result as any as PacienteItem[];
  } catch (error) {
    console.error('Erro ao listar pacientes no Neon:', error);
    return [];
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

