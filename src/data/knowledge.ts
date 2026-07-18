// Base de conhecimento do "método Butterfly" — usada pelo Chatbot de IA (RF08).
// No MVP, o Squad de Agentes (LangGraph/Antigravity) é simulado localmente:
// um "recuperador" busca aqui e um "auditor clínico" filtra sugestões fora da dieta.

export const ALLOWED_FOODS = [
  'ovos', 'abacate', 'folhas verdes', 'brócolis', 'couve-flor', 'abobrinha',
  'peixe', 'frango', 'castanhas', 'amêndoas', 'azeite de oliva', 'chá verde',
  'tapioca fina', 'pão de fermentação natural', 'pão de amêndoas', 'iogurte natural',
  'frutas vermelhas', 'sementes', 'água', 'coco',
]

export const FORBIDDEN_FOODS = [
  'açúcar', 'refrigerante', 'farinha de trigo', 'pão branco', 'frituras',
  'embutidos', 'salsicha', 'bacon', 'doces', 'sorvete', 'biscoito recheado',
  'maltodextrina', 'xarope de milho', 'margarina', 'fast food', 'álcool',
]

export interface KnowledgeEntry {
  keywords: string[]
  answer: string
  tip?: string
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    keywords: ['pão', 'pao', 'padaria'],
    answer:
      'Na Fase 1 do método, o foco é reduzir a inflamação. Evite pães de trigo tradicionais. As melhores opções são:\n• Pão 100% de farinha de amêndoas.\n• Pão de fermentação natural (sourdough) autêntico, caso não tenha sensibilidade severa.\n• Tapioca fina como alternativa rápida.',
    tip: 'Leia sempre o rótulo. Fuja de ingredientes com nomes complexos e açúcares escondidos (maltodextrina, xarope de milho).',
  },
  {
    keywords: ['ovo', 'ovos', 'café da manhã', 'cafe da manha'],
    answer:
      'Sim! Ovos são bem-vindos no protocolo. São ricos em proteína e saciam por mais tempo. Prepare mexidos, cozidos ou como omelete com folhas verdes e azeite de oliva.',
    tip: 'Prefira ovos caipiras e evite fritar em óleos refinados — use azeite ou óleo de coco.',
  },
  {
    keywords: ['açúcar', 'acucar', 'doce', 'sobremesa', 'adoçar'],
    answer:
      'Açúcar refinado está fora do protocolo — ele é um dos principais gatilhos inflamatórios. Para adoçar, use pequenas quantidades de frutas vermelhas ou, se necessário, adoçantes naturais aprovados no seu plano.',
    tip: 'Vontade de doce costuma ser sinal de sede ou cansaço. Beba água e observe antes de ceder.',
  },
  {
    keywords: ['álcool', 'alcool', 'vinho', 'cerveja', 'bebida'],
    answer:
      'Durante os 45 dias, recomendamos suspender o álcool. Ele sobrecarrega o fígado e atrapalha a desinflamação e o sono, dois pilares da sua metamorfose.',
    tip: 'Em eventos sociais, água com gás e rodela de limão é uma ótima substituição.',
  },
  {
    keywords: ['tempero', 'temperos', 'sal', 'condimento'],
    answer:
      'Temperos naturais são liberados e incentivados: alho, cebola, cúrcuma, gengibre, ervas frescas e azeite. Evite temperos prontos industrializados, que costumam ter glutamato e açúcar.',
    tip: 'Cúrcuma + pimenta-do-reino é uma dupla anti-inflamatória poderosa.',
  },
  {
    keywords: ['água', 'agua', 'hidratação', 'beber'],
    answer:
      'A meta é cerca de 2L por dia (35ml por kg de peso). A hidratação é essencial para eliminar toxinas e reduzir a retenção. Registre no seu Check-in Diário!',
    tip: 'Comece o dia com um copo de água morna com limão para ativar o metabolismo.',
  },
  {
    keywords: ['fruta', 'frutas'],
    answer:
      'Priorize frutas de baixo índice glicêmico: frutas vermelhas (morango, mirtilo, framboesa), abacate e coco. Frutas muito doces devem ser consumidas com moderação na Fase 1.',
    tip: 'Combine a fruta com uma gordura boa (castanhas) para suavizar o pico de glicose.',
  },
]

export const FALLBACK_ANSWER =
  'Essa é uma ótima pergunta! Não encontrei uma resposta específica na base oficial do método Butterfly para isso. Para não te dar uma orientação imprecisa, recomendo perguntar diretamente à administração ou ao seu profissional parceiro. Posso ajudar com dúvidas sobre alimentos permitidos, hidratação, temperos e as fases do protocolo.'

export const SUGGESTED_QUESTIONS = [
  'Posso comer ovo no café?',
  'Qual o melhor pão para a Fase 1?',
  'Como substituir o açúcar?',
  'Quanto de água por dia?',
]
