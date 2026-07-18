-- ============================================================================
-- App Butterfly — Migration 0003
-- Conteúdo gerenciável (aulas, e-books, base de conhecimento da IA),
-- progresso por usuária e histórico de chat. Inclui SEED extenso.
-- Rode no SQL Editor DEPOIS das migrations 0001 e 0002.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tabelas de conteúdo (catálogo — iguais para todas; escrita só admin)
-- ---------------------------------------------------------------------------
create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  tag         text,
  cover_url   text,
  order_index int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.lessons (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  module_slug   text references public.modules (slug) on delete set null,
  category      text not null default 'nutrition', -- module | nutrition | recipe | mind
  title         text not null,
  description   text,
  duration      text,
  thumbnail_url text,
  video_url     text,
  order_index   int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists lessons_category_idx on public.lessons (category, order_index);

create table if not exists public.ebooks (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  format      text not null default 'PDF',
  file_url    text,
  order_index int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.knowledge_entries (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  category   text,
  keywords   text[] not null default '{}',
  answer     text not null,
  tip        text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tabelas por usuária
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  lesson_id  uuid not null references public.lessons (id) on delete cascade,
  done       boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  tip        text,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_user_idx on public.chat_messages (user_id, created_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.modules           enable row level security;
alter table public.lessons           enable row level security;
alter table public.ebooks            enable row level security;
alter table public.knowledge_entries enable row level security;
alter table public.lesson_progress   enable row level security;
alter table public.chat_messages     enable row level security;

-- Catálogo: leitura para autenticadas; escrita só admin
do $$
declare t text;
begin
  foreach t in array array['modules','lessons','ebooks','knowledge_entries']
  loop
    execute format('drop policy if exists "%s_read" on public.%I', t, t);
    execute format('create policy "%s_read" on public.%I for select to authenticated using (true)', t, t);
    execute format('drop policy if exists "%s_admin_write" on public.%I', t, t);
    execute format($f$create policy "%s_admin_write" on public.%I for all
      using (public.current_app_role() = 'admin')
      with check (public.current_app_role() = 'admin')$f$, t, t);
  end loop;
end $$;

-- lesson_progress: própria dona
drop policy if exists "lesson_progress_rw_own" on public.lesson_progress;
create policy "lesson_progress_rw_own" on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- chat_messages: própria dona (admin pode ler para auditoria)
drop policy if exists "chat_select" on public.chat_messages;
create policy "chat_select" on public.chat_messages
  for select using (auth.uid() = user_id or public.current_app_role() = 'admin');
drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);
drop policy if exists "chat_delete_own" on public.chat_messages;
create policy "chat_delete_own" on public.chat_messages
  for delete using (auth.uid() = user_id);

-- ===========================================================================
-- SEED — conteúdo do método Butterfly (idempotente via slug/on conflict)
-- ===========================================================================

-- Módulos ------------------------------------------------------------------
insert into public.modules (slug, title, description, tag, cover_url, order_index) values
('mentalidade', 'Alinhamento de Mentalidade', 'Construa uma base solida para a sua transformacao. Aprenda a lidar com crencas limitantes e a cultivar uma mentalidade de abundancia e saude.', 'Modulo Principal', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=60', 0),
('nutricao', 'Fundamentos da Nutricao', 'Entenda como a comida conversa com o seu corpo e aprenda a montar pratos que desinflamam e dao energia.', 'Modulo', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=60', 1),
('receitas', 'Receitas Butterfly', 'Um receituario pratico para os 45 dias: cafes, almocos, jantares e lanches leves e saborosos.', 'Modulo', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=60', 2),
('mente', 'Mente e Mindfulness', 'Exercicios de respiracao, gratidao e regulacao emocional para sustentar a jornada.', 'Modulo', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=60', 3)
on conflict (slug) do nothing;

-- Aulas: Alinhamento de Mentalidade -----------------------------------------
insert into public.lessons (slug, module_slug, category, title, description, duration, thumbnail_url, order_index) values
('men-01', 'mentalidade', 'module', 'A Metamorfose Comeca na Mente', 'Por que 90% do resultado depende da sua mentalidade antes de qualquer prato.', '12:30', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=60', 0),
('men-02', 'mentalidade', 'module', 'Desarmando a Autossabotagem', 'Identifique os gatilhos que fazem voce desistir e crie respostas novas.', '15:10', 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=400&q=60', 1),
('men-03', 'mentalidade', 'module', 'Do Peso da Culpa a Leveza da Escolha', 'Como trocar a dieta punitiva por decisoes conscientes e gentis.', '10:45', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=60', 2),
('men-04', 'mentalidade', 'module', 'Habitos Que se Sustentam', 'A ciencia dos micro-habitos e como empilhar novos comportamentos.', '18:20', 'https://images.unsplash.com/photo-1483137140003-ae073b395549?auto=format&fit=crop&w=400&q=60', 3),
('men-05', 'mentalidade', 'module', 'Sua Visao de Borboleta', 'Desenhe quem voce quer ser ao fim dos 45 dias e ancore essa imagem.', '09:55', 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=400&q=60', 4)
on conflict (slug) do nothing;

-- Aulas: Guia de Alimentos (nutricao) ---------------------------------------
insert into public.lessons (slug, module_slug, category, title, description, duration, thumbnail_url, order_index) values
('nut-01', 'nutricao', 'nutrition', 'Fundamentos da Nutricao', 'Entenda os macronutrientes essenciais e como eles afetam a inflamacao.', '15:30', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=60', 0),
('nut-02', 'nutricao', 'nutrition', 'Superalimentos na Pratica', 'Como incorporar ingredientes densamente nutritivos sem complicar.', '22:15', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=60', 1),
('nut-03', 'nutricao', 'nutrition', 'O Prato Anti-inflamatorio', 'A regra do prato: metade vegetais, um quarto proteina, um quarto gordura boa.', '13:40', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=60', 2),
('nut-04', 'nutricao', 'nutrition', 'Acucar: O Vilao Escondido', 'Onde o acucar se esconde nos rotulos e como reduzir sem sofrimento.', '17:05', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=400&q=60', 3),
('nut-05', 'nutricao', 'nutrition', 'Gorduras Boas x Gorduras Ruins', 'Azeite, abacate e castanhas: por que a gordura certa emagrece.', '14:20', 'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=400&q=60', 4),
('nut-06', 'nutricao', 'nutrition', 'Hidratacao Inteligente', 'Quanta agua beber e como a hidratacao acelera a desinflamacao.', '08:50', 'https://images.unsplash.com/photo-1502740479091-635887520276?auto=format&fit=crop&w=400&q=60', 5),
('nut-07', 'nutricao', 'nutrition', 'Leitura de Rotulos sem Medo', 'Um passo a passo para decodificar embalagens em 10 segundos.', '11:30', 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=60', 6),
('nut-08', 'nutricao', 'nutrition', 'Intestino Saudavel, Corpo Leve', 'Fibras, fermentados e a conexao entre microbiota e humor.', '19:15', 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=400&q=60', 7),
('nut-09', 'nutricao', 'nutrition', 'Comer Fora sem Sair da Linha', 'Estrategias para restaurantes, festas e viagens.', '12:00', 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=400&q=60', 8),
('nut-10', 'nutricao', 'nutrition', 'Compras Conscientes', 'Monte a lista de mercado Butterfly e economize tempo e dinheiro.', '10:10', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=60', 9),
('nut-11', 'nutricao', 'nutrition', 'Jejum e Janelas Alimentares', 'O basico do jejum intermitente com seguranca (e quando evitar).', '16:40', 'https://images.unsplash.com/photo-1495546968767-f0573cca821e?auto=format&fit=crop&w=400&q=60', 10),
('nut-12', 'nutricao', 'nutrition', 'Montando Seu Cardapio da Semana', 'Planejamento de refeicoes para nao cair na tentacao.', '20:00', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=60', 11)
on conflict (slug) do nothing;

-- Aulas: Receitas Butterfly (recipe) ----------------------------------------
insert into public.lessons (slug, module_slug, category, title, description, duration, thumbnail_url, order_index) values
('rec-01', 'receitas', 'recipe', 'Cafes da Manha Revigorantes', 'Comece o dia com energia leve e constante com estas receitas.', '18:40', 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=60', 0),
('rec-02', 'receitas', 'recipe', 'Almocos de Baixa Friccao', 'Refeicoes completas e satisfatorias que nao pesam na digestao.', '25:00', 'https://images.unsplash.com/photo-1512852939750-1305098529bf?auto=format&fit=crop&w=400&q=60', 1),
('rec-03', 'receitas', 'recipe', 'Jantares Leves e Quentes', 'Sopas, refogados e assados para noites reconfortantes.', '21:30', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=60', 2),
('rec-04', 'receitas', 'recipe', 'Lanches que Salvam a Tarde', 'Opcoes praticas para a fome das 16h sem sabotar o plano.', '09:20', 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=400&q=60', 3),
('rec-05', 'receitas', 'recipe', 'Paes e Massas Permitidos', 'Pao de amendoas, tapioca e alternativas sem trigo.', '17:50', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=60', 4),
('rec-06', 'receitas', 'recipe', 'Saladas que Sustentam', 'Combinacoes que enchem o prato e o estomago.', '12:45', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=60', 5),
('rec-07', 'receitas', 'recipe', 'Sobremesas sem Culpa', 'Doces com frutas vermelhas, cacau e castanhas.', '14:15', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=60', 6),
('rec-08', 'receitas', 'recipe', 'Bebidas Funcionais', 'Cha verde, agua aromatizada e sucos verdes equilibrados.', '08:30', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=60', 7),
('rec-09', 'receitas', 'recipe', 'Marmitas para a Semana', 'Cozinhe uma vez e resolva cinco refeicoes.', '23:10', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=60', 8),
('rec-10', 'receitas', 'recipe', 'Ovos de Mil Jeitos', 'Mexidos, cozidos, omeletes e frittatas nutritivas.', '11:00', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=400&q=60', 9),
('rec-11', 'receitas', 'recipe', 'Peixes e Frutos do Mar', 'Preparos rapidos ricos em omega-3.', '16:25', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=60', 10),
('rec-12', 'receitas', 'recipe', 'Vegetais que Viram Estrela', 'Couve-flor, abobrinha e brocolis em versoes irresistiveis.', '13:55', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=60', 11)
on conflict (slug) do nothing;

-- Aulas: Mente e Mindfulness (mind) -----------------------------------------
insert into public.lessons (slug, module_slug, category, title, description, duration, thumbnail_url, order_index) values
('min-01', 'mente', 'mind', 'Respiracao para Acalmar a Fome Emocional', 'Uma tecnica de 3 minutos para pausar antes de comer.', '06:30', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=60', 0),
('min-02', 'mente', 'mind', 'Diario de Gratidao', 'Como registrar 3 gratidoes muda a quimica do seu dia.', '07:45', 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=400&q=60', 1),
('min-03', 'mente', 'mind', 'Meditacao do Corpo Leve', 'Um audio guiado para relaxar e reconectar.', '12:00', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=60', 2),
('min-04', 'mente', 'mind', 'Sono Reparador', 'Rituais noturnos que melhoram o sono e o emagrecimento.', '10:20', 'https://images.unsplash.com/photo-1495546968767-f0573cca821e?auto=format&fit=crop&w=400&q=60', 3),
('min-05', 'mente', 'mind', 'Lidando com Recaidas', 'O que fazer no dia seguinte a um deslize (sem drama).', '08:15', 'https://images.unsplash.com/photo-1483137140003-ae073b395549?auto=format&fit=crop&w=400&q=60', 4),
('min-06', 'mente', 'mind', 'Movimento como Celebracao', 'Ressignifique o exercicio: do castigo ao prazer.', '09:40', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=60', 5),
('min-07', 'mente', 'mind', 'Comunidade e Apoio', 'Por que caminhar acompanhada acelera a transformacao.', '07:05', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&q=60', 6),
('min-08', 'mente', 'mind', 'Ancorando a Nova Identidade', 'Rituais para consolidar quem voce se tornou.', '11:30', 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=400&q=60', 7)
on conflict (slug) do nothing;

-- E-books --------------------------------------------------------------------
insert into public.ebooks (slug, title, description, format, order_index) values
('eb-01', 'Guia de Alimentos Permitidos', 'A lista completa do que comer a vontade, com moderacao e evitar.', 'PDF', 0),
('eb-02', 'Receitas Butterfly Vol. 1', '30 receitas anti-inflamatorias para os primeiros 15 dias.', 'PDF', 1),
('eb-03', 'Receitas Butterfly Vol. 2', 'Mais 30 receitas para variar o cardapio ate o dia 45.', 'PDF', 2),
('eb-04', 'Lista de Compras Inteligente', 'Modelo pronto para o mercado, organizado por secao.', 'PDF', 3),
('eb-05', 'Planner de 45 Dias', 'Acompanhamento diario de habitos, agua e humor para imprimir.', 'PDF', 4),
('eb-06', 'Cardapio Base da Semana', 'Sugestao de 7 dias completos de refeicoes.', 'PDF', 5),
('eb-07', 'Guia de Temperos e Ervas', 'Como dar sabor sem industrializados nem excesso de sal.', 'PDF', 6),
('eb-08', 'Manual do Jejum com Seguranca', 'Quando, como e para quem o jejum intermitente funciona.', 'PDF', 7),
('eb-09', 'Substituicoes Inteligentes', 'Troque ingredientes inflamatorios por versoes Butterfly.', 'PDF', 8),
('eb-10', 'Diario de Mentalidade', 'Exercicios de escrita para desarmar a autossabotagem.', 'PDF', 9),
('eb-11', 'Guia de Sono e Descanso', 'Higiene do sono para potencializar resultados.', 'PDF', 10),
('eb-12', 'Perguntas Frequentes do Protocolo', 'As duvidas mais comuns das 45 dias respondidas.', 'PDF', 11)
on conflict (slug) do nothing;

-- Base de conhecimento da IA -------------------------------------------------
insert into public.knowledge_entries (slug, category, keywords, answer, tip) values
('kb-pao', 'alimentos', array['pao','pães','paes','padaria','gluten'], 'Na Fase 1 do metodo, o foco e reduzir a inflamacao. Evite paes de trigo tradicionais. As melhores opcoes sao: pao 100% de farinha de amendoas; pao de fermentacao natural (sourdough) autentico, caso nao tenha sensibilidade severa; e tapioca fina como alternativa rapida.', 'Leia sempre o rotulo. Fuja de ingredientes com nomes complexos e acucares escondidos.'),
('kb-ovo', 'alimentos', array['ovo','ovos','cafe da manha','omelete'], 'Sim! Ovos sao bem-vindos no protocolo. Sao ricos em proteina e saciam por mais tempo. Prepare mexidos, cozidos ou como omelete com folhas verdes e azeite de oliva.', 'Prefira ovos caipiras e evite fritar em oleos refinados; use azeite ou oleo de coco.'),
('kb-acucar', 'alimentos', array['acucar','açucar','doce','sobremesa','adocar'], 'Acucar refinado esta fora do protocolo, e um dos principais gatilhos inflamatorios. Para adocar, use pequenas quantidades de frutas vermelhas ou adocantes naturais aprovados no seu plano.', 'Vontade de doce costuma ser sinal de sede ou cansaco. Beba agua e observe antes de ceder.'),
('kb-alcool', 'alimentos', array['alcool','álcool','vinho','cerveja','bebida alcoolica'], 'Durante os 45 dias, recomendamos suspender o alcool. Ele sobrecarrega o figado e atrapalha a desinflamacao e o sono, dois pilares da sua metamorfose.', 'Em eventos sociais, agua com gas e rodela de limao e uma otima substituicao.'),
('kb-tempero', 'alimentos', array['tempero','temperos','sal','condimento','ervas'], 'Temperos naturais sao liberados e incentivados: alho, cebola, curcuma, gengibre, ervas frescas e azeite. Evite temperos prontos industrializados, que costumam ter glutamato e acucar.', 'Curcuma com pimenta-do-reino e uma dupla anti-inflamatoria poderosa.'),
('kb-agua', 'habitos', array['agua','água','hidratacao','beber','liquido'], 'A meta e cerca de 2L por dia (35ml por kg de peso). A hidratacao e essencial para eliminar toxinas e reduzir a retencao. Registre no seu Check-in Diario!', 'Comece o dia com um copo de agua morna com limao para ativar o metabolismo.'),
('kb-fruta', 'alimentos', array['fruta','frutas'], 'Priorize frutas de baixo indice glicemico: frutas vermelhas, abacate e coco. Frutas muito doces devem ser consumidas com moderacao na Fase 1.', 'Combine a fruta com uma gordura boa (castanhas) para suavizar o pico de glicose.'),
('kb-cafe', 'alimentos', array['cafe','café','cafeina'], 'Cafe puro e sem acucar e permitido com moderacao (ate 2 xicaras por dia). Evite adocar e nao exagere para nao atrapalhar o sono.', 'Se sentir ansiedade ou insonia, troque por cha verde ou cha de ervas a tarde.'),
('kb-leite', 'alimentos', array['leite','laticinio','laticinios','queijo','iogurte'], 'Laticinios podem ser inflamatorios para muitas pessoas. Na Fase 1, prefira versoes sem lactose ou alternativas vegetais. Iogurte natural integral pode entrar com moderacao se voce tolera bem.', 'Observe seu corpo: inchaco ou gases apos laticinios sao sinais para reduzir.'),
('kb-arroz', 'alimentos', array['arroz','carboidrato','batata'], 'Carboidratos como arroz branco e batata devem ser reduzidos na Fase 1. Prefira versoes integrais em pequenas porcoes, ou troque por couve-flor e legumes.', 'A batata-doce e uma boa fonte de energia em dias de treino, em porcoes moderadas.'),
('kb-exercicio', 'habitos', array['exercicio','atividade fisica','treino','caminhada'], 'Movimento e parte do protocolo. Comece com 30 minutos de caminhada por dia e evolua no seu ritmo. O importante e a constancia, nao a intensidade.', 'Registre a atividade no Check-in Diario para acumular pontos e evoluir seu avatar.'),
('kb-fase', 'protocolo', array['fase','fases','protocolo','45 dias','etapas'], 'O protocolo tem 45 dias divididos em fases de adaptacao, desinflamacao e consolidacao. Cada fase libera novos alimentos gradualmente. Siga o material do seu modulo para os detalhes.', 'Nao pule etapas: a progressao gradual e o que garante resultado sustentavel.'),
('kb-fome', 'habitos', array['fome','vontade','ansiedade','beliscar'], 'Fome constante costuma indicar refeicoes pobres em proteina e gordura boa. Reforce esses grupos e beba agua. Fome emocional pede pausa e respiracao, nao comida.', 'Antes de beliscar, respire fundo 3 vezes e beba um copo de agua; espere 10 minutos.'),
('kb-sono', 'habitos', array['sono','dormir','insonia','descanso'], 'Dormir bem e tao importante quanto comer bem. A privacao de sono aumenta a fome e a vontade de doces. Busque 7 a 8 horas e crie um ritual noturno.', 'Desligue telas 1 hora antes de dormir e evite cafeina apos as 16h.'),
('kb-gluten', 'alimentos', array['gluten','glúten','trigo','farinha'], 'Na Fase 1 evitamos gluten para reduzir a inflamacao. Prefira farinhas de amendoas, coco ou tapioca. Reintroducao pode ser avaliada nas fases seguintes.', 'Muitos produtos sem gluten sao ultraprocessados; prefira comida de verdade.'),
('kb-suplemento', 'protocolo', array['suplemento','vitamina','whey','colageno'], 'Suplementos nao substituem comida de verdade. Alguns podem ajudar (como omega-3 e vitamina D), mas so devem ser usados com orientacao do seu profissional parceiro.', 'Nunca inicie suplementacao por conta propria se voce tem condicoes clinicas.'),
('kb-emagrece', 'protocolo', array['emagrecer','perder peso','balanca','peso'], 'O emagrecimento e consequencia da desinflamacao e dos novos habitos, nao do foco na balanca. Meca-se por energia, sono, roupa e disposicao, alem do peso.', 'Pese-se no maximo uma vez por semana, sempre no mesmo horario e condicoes.'),
('kb-gestante', 'seguranca', array['gestante','gravida','amamentacao','gravidez'], 'Gestantes e lactantes precisam de acompanhamento profissional antes de iniciar qualquer restricao alimentar. A seguranca vem sempre em primeiro lugar.', 'Fale com seu medico parceiro para adaptar o protocolo com seguranca.'),
('kb-diabetes', 'seguranca', array['diabetes','diabetico','glicemia','insulina'], 'Pessoas com diabetes precisam de acompanhamento clinico para dietas restritivas, pois ha risco de hipoglicemia. O protocolo restritivo so e liberado com aval do profissional parceiro.', 'Monitore sua glicemia e nunca ajuste medicacao por conta propria.'),
('kb-recaida', 'mentalidade', array['recaida','deslize','sabotagem','desisti'], 'Um deslize nao apaga o seu progresso. O que importa e a proxima escolha. Volte ao plano na refeicao seguinte, sem culpa e sem compensar com restricao extrema.', 'Escreva o gatilho que levou ao deslize; entender e o primeiro passo para prevenir.')
on conflict (slug) do nothing;
