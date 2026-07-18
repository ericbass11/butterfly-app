# 🦋 App Butterfly — MVP Fase 1

Plataforma digital de **wellness, reeducação alimentar e mudança de mentalidade**.
Digitaliza e escala um protocolo de saúde de **45 dias** com gamificação, trilhas de
conteúdo e suporte por IA.

> PWA **mobile-first** construído em **React + TypeScript + Tailwind CSS**, seguindo o
> design system *Butterfly Wellness* (Metamorfose: **Larva → Casulo → Borboleta**).

---

## ✨ O que está implementado (mapa PRD → código)

| Épico / Requisito | Onde |
| --- | --- |
| **RF01** — Cadastro + Perfis de Acesso (RBAC: paciente / parceiro / admin) | `src/screens/Login.tsx`, `src/context/AuthContext.tsx`, `src/components/Guards.tsx` |
| **RF02** — Triagem e Segurança Clínica (anamnese + detecção de risco) | `src/screens/Onboarding.tsx`, `src/lib/anamnese.ts`, `src/screens/RiskBlocked.tsx` |
| **RF03** — Automação de Boas-Vindas (WhatsApp/E-mail via n8n) | `src/lib/supabase.ts` → `triggerAutomation()` |
| **RF04** — Tracker Diário de Hábitos | `src/screens/Dashboard.tsx`, `src/context/ProgramContext.tsx`, `src/lib/gamification.ts` |
| **RF05** — Upload de Evidências (foto da refeição) | `src/components/MealCapture.tsx` |
| **RF06** — Evolução Visual (avatar Larva/Casulo/Borboleta) | `src/components/ButterflyAvatar.tsx`, `src/lib/gamification.ts` |
| **RF07** — Plataforma de Membros (aulas + e-books) | `src/screens/Members.tsx`, `src/data/lessons.ts` |
| **RF08** — Chatbot de Suporte IA (respostas do método) | `src/screens/Chat.tsx`, `src/lib/aiSquad.ts`, `src/data/knowledge.ts` |
| **RNF01** — PWA React + Tailwind, mobile-first | Todo o projeto + `vite-plugin-pwa` |
| **RNF02** — Backend Supabase (Auth + Postgres + RLS) | `src/lib/supabase.ts` (com fallback local) |
| **RNF03** — Orquestração n8n | `triggerAutomation()` (webhook configurável) |
| **RNF04** — Squad de Agentes de IA (recuperador + auditor clínico) | `src/lib/aiSquad.ts` |
| Painéis por papel (Persona 2 e 3) | `src/screens/PartnerDashboard.tsx`, `src/screens/AdminDashboard.tsx` |

### User Flow coberto
Convite/Login → Anamnese → **Caminho A** (liberado) ou **Caminho B** (risco → médico
parceiro) → Dashboard → Check-in diário + foto → Conteúdo → Chat de IA sob demanda.

---

## 🎨 Design System

Os tokens do design system *Butterfly Wellness* (Material 3 / Google Stitch) foram
portados **fielmente** para `tailwind.config.js`:

- **Paleta:** Primária *Emerald Mint* `#006c46` (crescimento), Secundária *Soft Lavender*
  `#645785` (mente), neutros *warm-gray* (sem pretos puros), semânticos dessaturados.
- **Tipografia dual:** `Plus Jakarta Sans` (headlines/labels) + `Work Sans` (corpo).
- **Ícones:** Material Symbols Outlined (traços lineares 2px, cantos arredondados).
- **Estilo:** Minimalismo + Glassmorphism (`.glass-card`), sombras ambiente com tint
  lavanda, cantos arredondados (`rounded-xl` = 16px), progress bars *pill*.
- **Ritmo:** escala de 8px, container mobile 20px de margem / 16px de gutter.

> Para trocar por um Figma exato no futuro, basta substituir os valores em
> `tailwind.config.js` e as fontes em `index.html`.

---

## 🚀 Rodando o projeto

```bash
npm install
npm run dev        # ambiente de desenvolvimento (http://localhost:5173)
npm run build      # typecheck + build de produção
npm run preview    # serve o build
```

### Modo de dados

- **Sem `.env`** → roda em **modo demonstração**: autenticação simulada e progresso
  persistido em `localStorage`. Ideal para avaliar o MVP sem infraestrutura.
- **Com Supabase** → copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_N8N_WEBHOOK_URL=...   # opcional (automações WhatsApp/e-mail)
```

O app detecta as variáveis automaticamente (`isSupabaseConfigured`).

> 📄 Passo a passo completo para conectar ao Supabase (SQL das tabelas, RLS, auth e
> deploy): veja **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**.

### Testando os papéis (RBAC)
Na tela de login, escolha **Paciente**, **Parceiro** ou **Admin** — cada papel abre
áreas diferentes (o painel do parceiro/admin fica acessível pelo Perfil).

---

## 🏗️ Arquitetura

```
src/
├── components/     # UI (Icon, Button, TopBar, BottomNav, ProgressBar, ButterflyAvatar…)
├── context/        # AuthContext (RBAC) + ProgramContext (estado do programa de 45 dias)
├── data/           # base de conhecimento IA, aulas, roster (mock)
├── lib/            # domínio: gamification, anamnese, aiSquad, supabase, store, types
└── screens/        # Login, Onboarding, Dashboard, Members, Chat, Profile, Partner/Admin
```

### Notas técnicas
- **PWA:** `vite-plugin-pwa` gera `manifest` + service worker (Workbox) com cache de
  fontes do Google — o app funciona offline após a primeira carga.
- **Squad de IA (RNF04):** no MVP é simulado localmente (recuperador por palavra-chave +
  auditor que rejeita alimentos inflamatórios). A interface já está pronta para plugar
  LangGraph/Antigravity + banco vetorizado do método.
- **Segurança clínica:** condições de risco (diabetes, gestação, transtorno alimentar,
  menor de idade) **bloqueiam** o protocolo restritivo até liberação profissional.

---

## 🗺️ Próximos passos (pós-MVP)
- Provisionar Supabase (tabelas `profiles`, `anamneses`, `program_state`, `meals`) + RLS.
- Conectar o Squad de IA real e vetorizar a base do método.
- Fluxos n8n de WhatsApp/e-mail transacional.
- Notificações push (Android) e roadmap de Marketplace/Pagamentos.
