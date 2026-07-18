# 🔌 Conectando o App Butterfly ao Supabase

O app funciona em dois modos, detectados automaticamente:

- **Modo demonstração** (sem credenciais) → dados no `localStorage` do navegador.
- **Modo Supabase** (com credenciais) → autenticação real + Postgres com RLS.

Siga os 3 passos abaixo para ativar o modo Supabase com **dados reais**.

---

## 1. Criar as tabelas (SQL)

No painel do seu projeto Supabase:

1. Vá em **SQL Editor → New query**
2. Cole todo o conteúdo de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
3. Clique em **Run**

Isso cria as tabelas `profiles`, `anamneses`, `program_state`, `meals`, com **RLS**
(cada usuária só acessa os próprios dados), a função de papel e o **trigger** que cria
o perfil automaticamente no cadastro.

## 2. Ajustar a autenticação (para testes fluidos)

Por padrão o Supabase exige confirmação de e-mail antes do primeiro login.
Para testar rápido:

- **Authentication → Providers → Email**: mantenha **Email** habilitado.
- **Authentication → Sign In / Providers** (ou *Settings*): **desative "Confirm email"**
  (Confirmar e-mail). Assim o cadastro já entra direto.

> Em produção, deixe a confirmação ligada. O app já trata o caso: mostra
> "Confirme seu e-mail" e leva para a aba *Entrar*.

## 3. Fornecer as credenciais ao app

Pegue em **Project Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY` (é pública por design; a RLS protege os dados)

### a) Localmente (`npm run dev`)
Crie um arquivo `.env` na raiz (já está no `.gitignore`):

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...sua-anon-key...
```

### b) No GitHub Pages (deploy automático)
Em **Settings → Secrets and variables → Actions → aba _Variables_ → New repository variable**,
crie:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://SEU-PROJETO.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` |

O workflow (`.github/workflows/deploy.yml`) já lê essas variáveis no build.
Depois de criá-las, é só rodar o deploy de novo (novo push ou *Re-run* na aba Actions).

> ⚠️ Adicione a URL do site em **Authentication → URL Configuration → Redirect URLs**
> e **Site URL**: `https://ericbass11.github.io/butterfly-app/` — evita bloqueios de auth.

---

## Testando

1. Abra o app → a tela de login mostra **"Conectado ao Supabase"** e as abas
   **Criar conta / Entrar**.
2. Crie uma conta (nome, e-mail, senha, papel) → faça a anamnese → use o dashboard.
3. Confira no Supabase: **Table Editor** mostra as linhas em `profiles`, `anamneses`,
   `program_state` e `meals` sendo criadas em tempo real. 🎉

## Modelo de dados (resumo)

| Tabela | Conteúdo |
| --- | --- |
| `profiles` | 1:1 com `auth.users` — nome, e-mail, **papel** (RBAC), avatar |
| `anamneses` | respostas da triagem + `risk_level` / `requires_partner` |
| `program_state` | dia, pontos, estágio, check-ins do dia, streak, `onboarded` |
| `meals` | foto (base64) + nota de cada refeição registrada |

Fotos hoje são salvas em base64 na coluna `meals.image`. Um próximo passo natural é
migrar para o **Supabase Storage** (bucket privado + signed URLs).
