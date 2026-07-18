// Conteúdo da Área de Membros / Trilha de Aprendizado (RF07)

export interface Lesson {
  id: string
  title: string
  description: string
  duration: string
  thumbnail: string
  done?: boolean
}

export interface Ebook {
  id: string
  title: string
  format: string
}

export const MAIN_MODULE = {
  tag: 'Módulo Principal',
  title: 'Alinhamento de Mentalidade',
  description:
    'Construa uma base sólida para a sua transformação. Aprenda a lidar com crenças limitantes e a cultivar uma mentalidade de abundância e saúde.',
  totalLessons: 5,
  completedLessons: 3,
  cover:
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=60',
}

export const EBOOKS: Ebook[] = [
  { id: 'e1', title: 'Guia de Alimentos PDF', format: 'PDF' },
  { id: 'e2', title: 'Receitas Butterfly Vol. 1', format: 'PDF' },
]

export const NUTRITION_LESSONS: Lesson[] = [
  {
    id: 'n1',
    title: 'Fundamentos da Nutrição',
    description: 'Entenda os macronutrientes essenciais e como eles afetam a inflamação.',
    duration: '15:30',
    done: true,
    thumbnail:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'n2',
    title: 'Superalimentos na Prática',
    description: 'Como incorporar ingredientes densamente nutritivos sem complicar.',
    duration: '22:15',
    thumbnail:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=60',
  },
]

export const RECIPE_LESSONS: Lesson[] = [
  {
    id: 'r1',
    title: 'Cafés da Manhã Revigorantes',
    description: 'Comece o dia com energia leve e constante com estas receitas.',
    duration: '18:40',
    thumbnail:
      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'r2',
    title: 'Almoços de Baixa Fricção',
    description: 'Refeições completas e satisfatórias que não pesam na digestão.',
    duration: '25:00',
    thumbnail:
      'https://images.unsplash.com/photo-1512852939750-1305098529bf?auto=format&fit=crop&w=400&q=60',
  },
]

export const MOTIVATIONAL_QUOTES = [
  'Cada pequena escolha é uma asa que se fortalece para o voo de amanhã.',
  'A transformação acontece no silêncio da disciplina diária.',
  'Você não está desistindo de nada — está escolhendo leveza.',
  'O casulo não é uma prisão, é um laboratório de asas.',
]
