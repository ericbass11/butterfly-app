// Conteúdo estático usado no MODO DEMO (sem Supabase) e frases motivacionais.
// No modo Supabase, a Educação vem das tabelas modules/lessons/ebooks.
import type { DbEbook, DbLesson, DbModule } from '@/lib/db'

export const MOTIVATIONAL_QUOTES = [
  'Cada pequena escolha é uma asa que se fortalece para o voo de amanhã.',
  'A transformação acontece no silêncio da disciplina diária.',
  'Você não está desistindo de nada — está escolhendo leveza.',
  'O casulo não é uma prisão, é um laboratório de asas.',
]

const IMG = {
  cover: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=60',
  food: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=60',
  bowl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=60',
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=60',
  lunch: 'https://images.unsplash.com/photo-1512852939750-1305098529bf?auto=format&fit=crop&w=400&q=60',
  mind: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=60',
}

/** Conteúdo de demonstração no mesmo formato das tabelas do Supabase. */
export function demoContent(): { modules: DbModule[]; lessons: DbLesson[]; ebooks: DbEbook[] } {
  const modules: DbModule[] = [
    {
      id: 'm-mentalidade',
      slug: 'mentalidade',
      title: 'Alinhamento de Mentalidade',
      description:
        'Construa uma base sólida para a sua transformação. Aprenda a lidar com crenças limitantes e a cultivar uma mentalidade de abundância e saúde.',
      tag: 'Módulo Principal',
      cover: IMG.cover,
    },
  ]

  const mk = (
    id: string,
    category: string,
    title: string,
    description: string,
    duration: string,
    thumbnail: string,
    moduleSlug: string | null = null,
    video = '',
  ): DbLesson => ({
    id,
    slug: id,
    moduleSlug,
    category,
    title,
    description,
    duration,
    thumbnail,
    content: `${description}\n\nEsta é uma aula de demonstração. Conecte o Supabase (migration 0004) para carregar o conteúdo completo e os vídeos de cada aula.`,
    videoUrl: video,
  })

  const lessons: DbLesson[] = [
    mk('men-1', 'module', 'A Metamorfose Começa na Mente', 'Por que a mentalidade vem antes do prato.', '12:30', IMG.cover, 'mentalidade', 'https://www.youtube.com/watch?v=nsr41Byz3RY'),
    mk('men-2', 'module', 'Desarmando a Autossabotagem', 'Identifique gatilhos e crie respostas novas.', '15:10', IMG.mind, 'mentalidade', 'https://www.youtube.com/watch?v=IaVvM0JEBHw'),
    mk('men-3', 'module', 'Hábitos Que se Sustentam', 'A ciência dos micro-hábitos.', '18:20', IMG.cover, 'mentalidade', 'https://www.youtube.com/watch?v=DzIeFgIcz_I'),
    mk('nut-1', 'nutrition', 'Fundamentos da Nutrição', 'Entenda os macronutrientes essenciais e como eles afetam a inflamação.', '15:30', IMG.food, null, 'https://www.youtube.com/watch?v=80iqjwD0btc'),
    mk('nut-2', 'nutrition', 'Superalimentos na Prática', 'Como incorporar ingredientes densamente nutritivos sem complicar.', '22:15', IMG.bowl, null, 'https://www.youtube.com/watch?v=L0DTHT1UBJg'),
    mk('nut-3', 'nutrition', 'O Prato Anti-inflamatório', 'A regra do prato para desinflamar.', '13:40', IMG.food, null, 'https://www.youtube.com/watch?v=KpUnMbkDLfU'),
    mk('rec-1', 'recipe', 'Cafés da Manhã Revigorantes', 'Comece o dia com energia leve e constante.', '18:40', IMG.breakfast, null, 'https://www.youtube.com/watch?v=_0oVPpvMZTY'),
    mk('rec-2', 'recipe', 'Almoços de Baixa Fricção', 'Refeições completas que não pesam na digestão.', '25:00', IMG.lunch, null, 'https://www.youtube.com/watch?v=NkdTJpY6MyY'),
    mk('min-1', 'mind', 'Respiração para a Fome Emocional', 'Uma técnica de 3 minutos antes de comer.', '06:30', IMG.mind, null, 'https://www.youtube.com/watch?v=54YXuwPR50Q'),
    mk('min-2', 'mind', 'Diário de Gratidão', 'Como 3 gratidões mudam a química do seu dia.', '07:45', IMG.mind, null, 'https://www.youtube.com/watch?v=85uY4aO7SYE'),
  ]

  const ebooks: DbEbook[] = [
    { id: 'e1', title: 'Guia de Alimentos Permitidos', format: 'PDF' },
    { id: 'e2', title: 'Receitas Butterfly Vol. 1', format: 'PDF' },
    { id: 'e3', title: 'Planner de 45 Dias', format: 'PDF' },
  ]

  return { modules, lessons, ebooks }
}
