-- ==============================================================================
-- NutriConnectQS - Schema do Banco de Dados PostgreSQL (Neon)
-- ==============================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_session_jwt";

-- 2. Função Auxiliar para Obter ID do Usuário Atual (Compatível com Neon Auth, JWT e Sessão)
CREATE OR REPLACE FUNCTION public.current_user_id() 
RETURNS uuid 
LANGUAGE plpgsql 
STABLE
AS $$
BEGIN
    -- 1. Tenta via auth.uid() do pg_session_jwt / Neon Auth
    BEGIN
        IF auth.uid() IS NOT NULL THEN
            RETURN auth.uid();
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;

    -- 2. Tenta via variável de sessão da aplicação (SET LOCAL app.current_user_id = '...')
    BEGIN
        IF NULLIF(current_setting('app.current_user_id', true), '') IS NOT NULL THEN
            RETURN current_setting('app.current_user_id', true)::uuid;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;

    -- 3. Tenta via claim padrão do JWT PostgREST / Neon Data API
    BEGIN
        IF NULLIF(current_setting('request.jwt.claim.sub', true), '') IS NOT NULL THEN
            RETURN current_setting('request.jwt.claim.sub', true)::uuid;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            NULL;
    END;

    RETURN NULL;
END;
$$;

-- 3. Tabela nutricionistas
CREATE TABLE IF NOT EXISTS public.nutricionistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela pacientes
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutricionista_id UUID NOT NULL REFERENCES public.nutricionistas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    data_nascimento DATE,
    sexo TEXT,
    whatsapp TEXT,
    email TEXT,
    peso_inicial NUMERIC,
    altura NUMERIC,
    objetivos TEXT[],
    objetivo_texto TEXT,
    nivel_atividade TEXT,
    patologias TEXT[],
    restricoes_alimentares TEXT[],
    alergias TEXT[],
    medicamentos TEXT,
    suplementos TEXT,
    refeicoes_por_dia INTEGER,
    horario_acorda TEXT,
    horario_dorme TEXT,
    litros_agua NUMERIC,
    atividade_fisica BOOLEAN,
    atividade_fisica_descricao TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela consultas
CREATE TABLE IF NOT EXISTS public.consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    data_consulta DATE NOT NULL,
    peso NUMERIC,
    cintura NUMERIC,
    quadril NUMERIC,
    percentual_gordura NUMERIC,
    observacoes TEXT,
    proximo_retorno DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela planos_alimentares
CREATE TABLE IF NOT EXISTS public.planos_alimentares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    conteudo JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Índices para Chaves Estrangeiras e Otimização de Consultas RLS
CREATE INDEX IF NOT EXISTS idx_pacientes_nutricionista_id ON public.pacientes(nutricionista_id);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id ON public.consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_planos_alimentares_paciente_id ON public.planos_alimentares(paciente_id);

-- 8. Ativação de Row Level Security (RLS)
ALTER TABLE public.nutricionistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_alimentares ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS para nutricionistas
CREATE POLICY nutricionistas_select_own ON public.nutricionistas
    FOR SELECT
    USING (id = public.current_user_id());

CREATE POLICY nutricionistas_insert_own ON public.nutricionistas
    FOR INSERT
    WITH CHECK (id = public.current_user_id());

CREATE POLICY nutricionistas_update_own ON public.nutricionistas
    FOR UPDATE
    USING (id = public.current_user_id())
    WITH CHECK (id = public.current_user_id());

CREATE POLICY nutricionistas_delete_own ON public.nutricionistas
    FOR DELETE
    USING (id = public.current_user_id());

-- 10. Políticas RLS para pacientes
CREATE POLICY pacientes_select_own ON public.pacientes
    FOR SELECT
    USING (nutricionista_id = public.current_user_id());

CREATE POLICY pacientes_insert_own ON public.pacientes
    FOR INSERT
    WITH CHECK (nutricionista_id = public.current_user_id());

CREATE POLICY pacientes_update_own ON public.pacientes
    FOR UPDATE
    USING (nutricionista_id = public.current_user_id())
    WITH CHECK (nutricionista_id = public.current_user_id());

CREATE POLICY pacientes_delete_own ON public.pacientes
    FOR DELETE
    USING (nutricionista_id = public.current_user_id());

-- 11. Políticas RLS para consultas
CREATE POLICY consultas_select_own ON public.consultas
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.pacientes p
        WHERE p.id = consultas.paciente_id
          AND p.nutricionista_id = public.current_user_id()
    ));

CREATE POLICY consultas_insert_own ON public.consultas
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.pacientes p
        WHERE p.id = consultas.paciente_id
          AND p.nutricionista_id = public.current_user_id()
    ));

CREATE POLICY consultas_update_own ON public.consultas
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.pacientes p
        WHERE p.id = consultas.paciente_id
          AND p.nutricionista_id = public.current_user_id()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.pacientes p
        WHERE p.id = consultas.paciente_id
          AND p.nutricionista_id = public.current_user_id()
    ));

CREATE POLICY consultas_delete_own ON public.consultas
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.pacientes p
        WHERE p.id = consultas.paciente_id
          AND p.nutricionista_id = public.current_user_id()
    ));

-- 12. Políticas RLS para planos_alimentares
CREATE POLICY planos_alimentares_select_own ON public.planos_alimentares
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.pacientes p
        WHERE p.id = planos_alimentares.paciente_id
          AND p.nutricionista_id = public.current_user_id()
    ));

CREATE POLICY planos_alimentares_insert_own ON public.planos_alimentares
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.pacientes p
        WHERE p.id = planos_alimentares.paciente_id
          AND p.nutricionista_id = public.current_user_id()
    ));

CREATE POLICY planos_alimentares_update_own ON public.planos_alimentares
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.pacientes p
        WHERE p.id = planos_alimentares.paciente_id
          AND p.nutricionista_id = public.current_user_id()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.pacientes p
        WHERE p.id = planos_alimentares.paciente_id
          AND p.nutricionista_id = public.current_user_id()
    ));

CREATE POLICY planos_alimentares_delete_own ON public.planos_alimentares
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.pacientes p
        WHERE p.id = planos_alimentares.paciente_id
          AND p.nutricionista_id = public.current_user_id()
    ));

-- 13. Sincronização Automática com Neon Auth (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_neon_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.nutricionistas (id, nome, email, created_at)
    VALUES (NEW.id, COALESCE(NEW.name, split_part(NEW.email, '@', 1)), NEW.email, COALESCE(NEW."createdAt", CURRENT_TIMESTAMP))
    ON CONFLICT (id) DO UPDATE 
    SET nome = EXCLUDED.nome, email = EXCLUDED.email;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_neon_auth_user_created ON neon_auth.user;
CREATE TRIGGER on_neon_auth_user_created
AFTER INSERT OR UPDATE ON neon_auth.user
FOR EACH ROW EXECUTE FUNCTION public.handle_new_neon_user();

