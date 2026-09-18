# NutriConnectQS 🥗

Sistema moderno e completo de gestão clínica para nutricionistas, construído com React, Vite, TypeScript, Tailwind CSS e Neon Serverless PostgreSQL.

## 🚀 Tecnologias

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, React Router DOM
- **Backend & Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Autenticação:** Neon Auth (`@neondatabase/neon-js/auth`)
- **Bundler:** Vite

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
- Conta no [Neon.tech](https://neon.tech) com banco de dados PostgreSQL e Neon Auth configurados

## ⚙️ Configuração do Ambiente

1. Clone o repositório:
   ```bash
   git clone https://github.com/guuhferiani/NutriConnectQS.git
   cd NutriConnectQS
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`:
     ```bash
     cp .env.example .env
     ```
   - Preencha com suas credenciais do Neon:
     ```env
     VITE_NEON_AUTH_URL=https://<seu-neon-auth-id>.neonauth.<regiao>.aws.neon.tech/neondb/auth
     VITE_DATABASE_URL=postgresql://<usuario>:<senha>@<endpoint-pooler>.neon.tech/neondb?sslmode=require
     ```

4. Inicialize o schema do banco de dados:
   - Execute o script `schema.sql` no SQL Editor do seu console Neon.

## 💻 Executando o Projeto

```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Compilar para produção
npm run build

# Pré-visualizar o build de produção
npm run preview
```

## 🔒 Segurança

- Arquivos contendo segredos e credenciais locais (`.env`, `.env.*.local`) são estritamente ignorados pelo `.gitignore`.
- Nunca envie credenciais de produção diretamente para o repositório. Use variáveis de ambiente para gerenciar acessos seguros.

## 📄 Licença

Este projeto é de uso privado e confidencial.
