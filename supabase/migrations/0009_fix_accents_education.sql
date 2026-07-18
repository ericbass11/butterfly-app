-- ============================================================================
-- App Butterfly — Migration 0009
-- Corrige a ACENTUAÇÃO de todo o conteúdo da Educação (módulos, e-books e as 37
-- aulas: título, descrição e texto). O seed original foi gravado sem acentos.
-- Idempotente. Rode no SQL Editor DEPOIS da 0008.
-- ============================================================================

-- ---------- Módulos ----------
update public.modules as m
set title = v.title, description = v.description, tag = v.tag
from (values
  ('mentalidade', E'Alinhamento de Mentalidade', E'Construa uma base sólida para a sua transformação. Aprenda a lidar com crenças limitantes e a cultivar uma mentalidade de abundância e saúde.', E'Módulo Principal'),
  ('nutricao', E'Fundamentos da Nutrição', E'Entenda como a comida conversa com o seu corpo e aprenda a montar pratos que desinflamam e dão energia.', E'Módulo'),
  ('receitas', E'Receitas Butterfly', E'Um receituário prático para os 45 dias: cafés, almoços, jantares e lanches leves e saborosos.', E'Módulo'),
  ('mente', E'Mente e Mindfulness', E'Exercícios de respiração, gratidão e regulação emocional para sustentar a jornada.', E'Módulo')
) as v(slug, title, description, tag)
where m.slug = v.slug;

-- ---------- E-books ----------
update public.ebooks as e
set title = v.title, description = v.description
from (values
  ('eb-01', E'Guia de Alimentos Permitidos', E'A lista completa do que comer à vontade, com moderação e evitar.'),
  ('eb-02', E'Receitas Butterfly Vol. 1', E'30 receitas anti-inflamatórias para os primeiros 15 dias.'),
  ('eb-03', E'Receitas Butterfly Vol. 2', E'Mais 30 receitas para variar o cardápio até o dia 45.'),
  ('eb-04', E'Lista de Compras Inteligente', E'Modelo pronto para o mercado, organizado por seção.'),
  ('eb-05', E'Planner de 45 Dias', E'Acompanhamento diário de hábitos, água e humor para imprimir.'),
  ('eb-06', E'Cardápio Base da Semana', E'Sugestão de 7 dias completos de refeições.'),
  ('eb-07', E'Guia de Temperos e Ervas', E'Como dar sabor sem industrializados nem excesso de sal.'),
  ('eb-08', E'Manual do Jejum com Segurança', E'Quando, como e para quem o jejum intermitente funciona.'),
  ('eb-09', E'Substituições Inteligentes', E'Troque ingredientes inflamatórios por versões Butterfly.'),
  ('eb-10', E'Diário de Mentalidade', E'Exercícios de escrita para desarmar a autossabotagem.'),
  ('eb-11', E'Guia de Sono e Descanso', E'Higiene do sono para potencializar resultados.'),
  ('eb-12', E'Perguntas Frequentes do Protocolo', E'As dúvidas mais comuns dos 45 dias respondidas.')
) as v(slug, title, description)
where e.slug = v.slug;

-- ---------- Aulas (título, descrição, conteúdo) ----------
update public.lessons as l
set title = v.title, description = v.description, content = v.content
from (values

-- Módulo: Alinhamento de Mentalidade
('men-01', E'A Metamorfose Começa na Mente', E'Por que 90% do resultado depende da sua mentalidade antes de qualquer prato.',
 E'A metamorfose começa muito antes do prato: começa na forma como você pensa sobre si mesma e sobre comida.\n\nNesta aula você vai entender por que a mentalidade responde pela maior parte do resultado. Dietas baseadas só em regras falham porque ignoram as crenças que sustentam os hábitos. Quando a mente muda, as escolhas mudam sozinhas.\n\nPrática de hoje: escreva em uma frase quem você quer se tornar nos próximos 45 dias. Leia essa frase toda manhã.'),
('men-02', E'Desarmando a Autossabotagem', E'Identifique os gatilhos que fazem você desistir e crie respostas novas.',
 E'A autossabotagem não é falta de força de vontade: é um padrão automático de proteção. Entender o gatilho é o primeiro passo para desarmá-lo.\n\nMapeie as situações em que você costuma sair do plano (cansaço, ansiedade, festas, brigas). Para cada gatilho, crie de antemão uma resposta nova e simples. O objetivo não é ser perfeita, é ter um plano B pronto.\n\nPrática: liste seus 3 principais gatilhos e uma ação substituta para cada um.'),
('men-03', E'Do Peso da Culpa à Leveza da Escolha', E'Como trocar a dieta punitiva por decisões conscientes e gentis.',
 E'A dieta punitiva funciona na base da culpa, e a culpa cansa. O método Butterfly troca punição por escolha consciente.\n\nCada refeição é uma decisão, não um julgamento moral. Comer algo fora do plano não faz de você um fracasso; é apenas um dado. A leveza vem quando você para de se punir e volta a se cuidar na próxima escolha.\n\nPrática: troque a frase "eu não posso" por "eu escolho" durante um dia inteiro e observe a diferença.'),
('men-04', E'Hábitos Que se Sustentam', E'A ciência dos micro-hábitos e como empilhar novos comportamentos.',
 E'Hábitos sustentáveis nascem pequenos. Grandes viradas costumam durar pouco; micro-hábitos se mantêm.\n\nUse a técnica do empilhamento: ancore um hábito novo em algo que você já faz. Exemplo: "depois de escovar os dentes, bebo um copo de água". A repetição cria o automatismo, e o automatismo libera sua energia para o que importa.\n\nPrática: escolha 1 micro-hábito e empilhe-o em uma rotina que já existe no seu dia.'),
('men-05', E'Sua Visão de Borboleta', E'Desenhe quem você quer ser ao fim dos 45 dias e ancore essa imagem.',
 E'Toda transformação precisa de um destino. Sua visão de borboleta é a imagem clara de quem você será ao fim dos 45 dias.\n\nQuanto mais viva a imagem (como você se sente, veste, dorme, se move), mais forte a âncora nos momentos difíceis. Não é sobre um número na balança, é sobre uma versão mais leve de você.\n\nPrática: descreva em 5 linhas o seu "eu borboleta" e releia sempre que bater a vontade de desistir.'),

-- Guia de Alimentos (nutrição)
('nut-01', E'Fundamentos da Nutrição', E'Entenda os macronutrientes essenciais e como eles afetam a inflamação.',
 E'Os macronutrientes (proteínas, gorduras e carboidratos) conversam com o seu corpo o tempo todo. Entender essa conversa é a base de tudo.\n\nProteínas constroem e saciam; gorduras boas regulam hormônios; carboidratos dão energia, mas em excesso e na forma errada inflamam. Na Fase 1, o foco é reduzir os carboidratos refinados e priorizar comida de verdade.\n\nPrática: em cada refeição de hoje, garanta uma fonte de proteína e uma de gordura boa.'),
('nut-02', E'Superalimentos na Prática', E'Como incorporar ingredientes densamente nutritivos sem complicar.',
 E'Superalimentos não precisam ser caros nem exóticos. São alimentos densos em nutrientes que cabem no seu dia a dia.\n\nFolhas verde-escuras, frutas vermelhas, castanhas, sementes, ovos e peixes pequenos entregam muito por porção. O segredo não é comer de tudo, é comer bem daquilo que nutre.\n\nPrática: inclua 2 superalimentos em uma refeição de hoje (ex: espinafre e castanhas).'),
('nut-03', E'O Prato Anti-inflamatório', E'A regra do prato: metade vegetais, um quarto proteína, um quarto gordura boa.',
 E'O prato anti-inflamatório segue uma regra simples e visual: metade de vegetais, um quarto de proteína, um quarto de gordura boa ou carboidrato do bem.\n\nEssa proporção estabiliza a glicose, prolonga a saciedade e reduz a inflamação. Você não precisa contar calorias, precisa montar bem o prato.\n\nPrática: monte seu almoço seguindo a regra do prato e observe como você se sente 2 horas depois.'),
('nut-04', E'Açúcar: O Vilão Escondido', E'Onde o açúcar se esconde nos rótulos e como reduzir sem sofrimento.',
 E'O açúcar refinado é um dos maiores gatilhos inflamatórios, e ele se esconde onde você menos espera: molhos, pães, bebidas e produtos "fit".\n\nAprenda a reconhecer os nomes disfarçados (xarope de milho, maltodextrina, dextrose). Reduzir açúcar não é sofrimento: é recuperar o paladar para o sabor real dos alimentos.\n\nPrática: leia o rótulo de 3 produtos da sua despensa e procure o açúcar escondido.'),
('nut-05', E'Gorduras Boas x Gorduras Ruins', E'Azeite, abacate e castanhas: por que a gordura certa emagrece.',
 E'Gordura não é vilã. A gordura certa emagrece, sacia e regula hormônios.\n\nPrefira azeite de oliva, abacate, castanhas e o ômega-3 dos peixes. Evite gorduras trans e óleos vegetais refinados usados em frituras e ultraprocessados. A diferença entre uma gordura e outra muda todo o resultado.\n\nPrática: troque um óleo refinado por azeite ou óleo de coco em um preparo de hoje.'),
('nut-06', E'Hidratação Inteligente', E'Quanta água beber e como a hidratação acelera a desinflamação.',
 E'A água é a ferramenta mais barata e subestimada do protocolo. A meta é cerca de 35ml por kg de peso (perto de 2L).\n\nA hidratação ajuda a eliminar toxinas, reduz a retenção e diminui a falsa fome. Muitas vezes o corpo pede água e a gente interpreta como vontade de comer.\n\nPrática: comece o dia com um copo de água e registre a água no seu Check-in Diário.'),
('nut-07', E'Leitura de Rótulos sem Medo', E'Um passo a passo para decodificar embalagens em 10 segundos.',
 E'Saber ler rótulos é um superpoder. Em 10 segundos você decide se um produto entra ou não no carrinho.\n\nRegra prática: olhe a lista de ingredientes (não só a tabela nutricional). Quanto menor a lista e mais reconhecíveis os nomes, melhor. Fuja de listas longas cheias de palavras químicas e açúcares.\n\nPrática: escolha o produto com a lista de ingredientes mais curta na sua próxima compra.'),
('nut-08', E'Intestino Saudável, Corpo Leve', E'Fibras, fermentados e a conexão entre microbiota e humor.',
 E'Seu intestino é seu segundo cérebro. Uma microbiota saudável melhora humor, imunidade e a forma como você absorve nutrientes.\n\nFibras (vegetais, sementes) e alimentos fermentados alimentam as bactérias boas. Um intestino inflamado sabota o emagrecimento e a energia.\n\nPrática: inclua uma fonte de fibra em cada refeição de hoje e observe a digestão.'),
('nut-09', E'Comer Fora sem Sair da Linha', E'Estratégias para restaurantes, festas e viagens.',
 E'Comer fora não precisa sabotar o plano. Com estratégia, você mantém a linha em restaurantes, festas e viagens.\n\nDefina o prato antes de sentir fome, comece pela salada e pela proteína, beba água e evite o "modo automático" do bufê. Uma escolha consciente vale mais que a perfeição impossível.\n\nPrática: no próximo evento, decida o que vai comer antes de chegar.'),
('nut-10', E'Compras Conscientes', E'Monte a lista de mercado Butterfly e economize tempo e dinheiro.',
 E'A batalha do emagrecimento se ganha no mercado, não na cozinha. O que você não compra, não come.\n\nMonte uma lista organizada por seção, vá ao mercado sem fome e priorize a periferia do supermercado (hortifrúti, açougue), onde estão os alimentos de verdade.\n\nPrática: monte sua lista Butterfly da semana antes de sair de casa.'),
('nut-11', E'Jejum e Janelas Alimentares', E'O básico do jejum intermitente com segurança (e quando evitar).',
 E'O jejum intermitente pode ajudar a desinflamar e organizar as janelas alimentares, mas não é para todo mundo.\n\nComece simples (ex: 12 horas sem comer, incluindo o sono) e evolua com segurança. Pessoas com condições clínicas devem falar com o profissional parceiro antes.\n\nPrática: experimente encerrar o jantar mais cedo e observar a fome da manhã seguinte.'),
('nut-12', E'Montando Seu Cardápio da Semana', E'Planejamento de refeições para não cair na tentação.',
 E'Planejar o cardápio da semana é o que separa quem segue o plano de quem cai na tentação.\n\nEscolha 3 cafés, 3 almoços e 3 jantares que você gosta e repita. Simplicidade gera consistência. Deixe opções prontas para os dias corridos.\n\nPrática: defina o cardápio dos próximos 3 dias e faça a lista de compras correspondente.'),

-- Receitas Butterfly
('rec-01', E'Cafés da Manhã Revigorantes', E'Comece o dia com energia leve e constante com estas receitas.',
 E'O café da manhã certo estabiliza sua energia e reduz a fome do resto do dia.\n\nAposte em proteína e gordura boa: ovos, abacate, iogurte natural, castanhas. Evite começar o dia só com carboidrato, que gera pico e queda de glicose.\n\nExperimente: ovos mexidos com folhas e azeite, ou iogurte natural com frutas vermelhas e sementes.'),
('rec-02', E'Almoços de Baixa Fricção', E'Refeições completas e satisfatórias que não pesam na digestão.',
 E'Almoços de baixa fricção são completos e fáceis de digerir, para você não apagar no meio da tarde.\n\nUse a regra do prato: vegetais, uma boa proteína e uma gordura boa. Tempere com ervas, alho e azeite.\n\nExperimente: filé de frango grelhado, salada colorida e abobrinha refogada no azeite.'),
('rec-03', E'Jantares Leves e Quentes', E'Sopas, refogados e assados para noites reconfortantes.',
 E'Jantares leves e quentes acalmam o corpo e preparam para um sono melhor.\n\nSopas, refogados e assados de vegetais com proteína são perfeitos. Evite refeições muito pesadas ou cheias de carboidrato refinado à noite.\n\nExperimente: creme de abóbora com gengibre e um ovo pochê por cima.'),
('rec-04', E'Lanches que Salvam a Tarde', E'Opções práticas para a fome das 16h sem sabotar o plano.',
 E'O lanche da tarde é onde muita gente escorrega. Ter opções prontas evita o ataque ao açúcar.\n\nCastanhas, fruta com pasta de amendoim sem açúcar, iogurte natural ou ovos cozidos resolvem a fome das 16h.\n\nExperimente: um punhado de castanhas com uma fruta vermelha.'),
('rec-05', E'Pães e Massas Permitidos', E'Pão de amêndoas, tapioca e alternativas sem trigo.',
 E'Dá para ter pão e massa no protocolo, desde que nas versões certas, sem trigo refinado.\n\nPão de farinha de amêndoas, tapioca fina e macarrão de vegetais (abobrinha, palmito) são ótimas escolhas.\n\nExperimente: uma tapioca fina com recheio de ovo e folhas.'),
('rec-06', E'Saladas que Sustentam', E'Combinações que enchem o prato e o estômago.',
 E'Uma boa salada sustenta e não pesa. O segredo é a variedade e uma boa gordura.\n\nCombine folhas, legumes coloridos, uma proteína e finalize com azeite e sementes. Salada não precisa ser sinônimo de fome.\n\nExperimente: folhas, grão-de-bico, tomate, pepino, azeite e gergelim.'),
('rec-07', E'Sobremesas sem Culpa', E'Doces com frutas vermelhas, cacau e castanhas.',
 E'Sobremesa sem culpa existe e cabe no protocolo, com moderação.\n\nFrutas vermelhas, cacau acima de 70%, e receitas com castanhas satisfazem a vontade de doce sem o açúcar refinado.\n\nExperimente: morangos com cacau amargo derretido e um toque de castanha.'),
('rec-08', E'Bebidas Funcionais', E'Chá verde, água aromatizada e sucos verdes equilibrados.',
 E'Bebidas funcionais ajudam na hidratação e no ritual do dia sem açúcar escondido.\n\nChá verde, água aromatizada com limão e hortelã, e sucos verdes equilibrados são boas escolhas. Cuidado com sucos de fruta puros, que concentram açúcar.\n\nExperimente: água com gás, limão e folhas de hortelã no lugar do refrigerante.'),
('rec-09', E'Marmitas para a Semana', E'Cozinhe uma vez e resolva cinco refeições.',
 E'Marmitar é a estratégia mais poderosa para não sair do plano na correria.\n\nCozinhe uma vez e monte porções para vários dias. Separe proteína, vegetais e uma gordura boa em potes prontos.\n\nExperimente: asse frango e legumes de uma vez e monte 4 marmitas equilibradas.'),
('rec-10', E'Ovos de Mil Jeitos', E'Mexidos, cozidos, omeletes e frittatas nutritivas.',
 E'Ovos são o coringa do protocolo: baratos, versáteis e muito nutritivos.\n\nMexidos, cozidos, pochê, omeletes ou frittatas com vegetais resolvem qualquer refeição. Ricos em proteína, saciam por horas.\n\nExperimente: uma frittata de ovos com espinafre, tomate e azeite.'),
('rec-11', E'Peixes e Frutos do Mar', E'Preparos rápidos ricos em ômega-3.',
 E'Peixes e frutos do mar são fontes de ômega-3, uma gordura poderosamente anti-inflamatória.\n\nSardinha, salmão e outros peixes preparados de forma simples (grelhados ou assados) são rápidos e potentes.\n\nExperimente: sardinha grelhada com limão, azeite e uma salada verde.'),
('rec-12', E'Vegetais que Viram Estrela', E'Couve-flor, abobrinha e brócolis em versões irresistíveis.',
 E'Vegetais podem ser a estrela do prato quando bem preparados.\n\nCouve-flor, abobrinha e brócolis assados no azeite com alho e ervas ganham sabor e textura. Fuja do cozido sem graça.\n\nExperimente: couve-flor assada no azeite com cúrcuma e alho.'),

-- Mente e Mindfulness
('min-01', E'Respiração para Acalmar a Fome Emocional', E'Uma técnica de 3 minutos para pausar antes de comer.',
 E'A fome emocional pede uma pausa, não comida. Uma respiração consciente cria o espaço para escolher.\n\nAntes de comer por impulso, respire fundo 3 vezes, bem devagar. Esse pequeno intervalo tira você do piloto automático e devolve o controle.\n\nPrática: da próxima vez que bater a vontade fora de hora, respire 3 vezes e beba um copo de água antes de decidir.'),
('min-02', E'Diário de Gratidão', E'Como registrar 3 gratidões muda a química do seu dia.',
 E'A gratidão muda a química do seu dia. Registrar o que há de bom treina o cérebro para o que funciona.\n\nAnotar 3 gratidões por dia reduz ansiedade e melhora a relação com a comida e com o corpo.\n\nPrática: antes de dormir, escreva 3 coisas boas do seu dia, por menores que sejam.'),
('min-03', E'Meditação do Corpo Leve', E'Um áudio guiado para relaxar e reconectar.',
 E'A meditação do corpo leve relaxa a tensão acumulada e reconecta você com o presente.\n\nSente-se confortável, feche os olhos e leve a atenção para cada parte do corpo, soltando a tensão. Poucos minutos já acalmam o sistema nervoso.\n\nPrática: reserve 10 minutos hoje para o áudio guiado desta aula.'),
('min-04', E'Sono Reparador', E'Rituais noturnos que melhoram o sono e o emagrecimento.',
 E'Dormir bem é tão importante quanto comer bem. A falta de sono aumenta a fome e a vontade de doces.\n\nCrie um ritual noturno: menos telas, luz baixa, um chá sem cafeína. O sono reparador acelera o emagrecimento e melhora o humor.\n\nPrática: desligue as telas 1 hora antes de dormir por 3 noites e observe a diferença.'),
('min-05', E'Lidando com Recaídas', E'O que fazer no dia seguinte a um deslize (sem drama).',
 E'Recaída faz parte do processo. O que define o resultado não é o deslize, é a próxima escolha.\n\nUm dia fora do plano não apaga semanas de progresso. Volte ao ritmo na próxima refeição, sem culpa e sem compensar com restrição extrema.\n\nPrática: depois de um deslize, escreva o gatilho que levou a ele e siga em frente.'),
('min-06', E'Movimento como Celebração', E'Ressignifique o exercício: do castigo ao prazer.',
 E'Movimento não é castigo, é celebração do que o corpo pode fazer.\n\nEscolha uma atividade que você gosta e comece pequeno: uma caminhada de 30 minutos já muda o dia. A constância vale mais que a intensidade.\n\nPrática: marque uma caminhada hoje e registre no seu Check-in Diário.'),
('min-07', E'Comunidade e Apoio', E'Por que caminhar acompanhada acelera a transformação.',
 E'Ninguém se transforma sozinho. Caminhar acompanhada acelera e sustenta a mudança.\n\nCompartilhar a jornada, pedir apoio e celebrar pequenas vitórias com a comunidade aumenta muito a chance de sucesso.\n\nPrática: conte para alguém de confiança sobre a sua meta dos 45 dias.'),
('min-08', E'Ancorando a Nova Identidade', E'Rituais para consolidar quem você se tornou.',
 E'A última etapa é ancorar a nova identidade: você não está de dieta, você se tornou uma pessoa que se cuida.\n\nRituais simples ajudam a consolidar quem você se tornou. Celebre a borboleta e defina como vai manter o voo depois dos 45 dias.\n\nPrática: escreva uma carta para a sua versão de daqui a 6 meses.')

) as v(slug, title, description, content)
where l.slug = v.slug;
