import { TopBar } from '@/components/TopBar'
import { Icon } from '@/components/Icon'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/Button'
import { EBOOKS, MAIN_MODULE, NUTRITION_LESSONS, RECIPE_LESSONS, type Lesson } from '@/data/lessons'

/** Área de Membros — Trilha de Aprendizado (RF07). */
export function Members() {
  const progressRatio = MAIN_MODULE.completedLessons / MAIN_MODULE.totalLessons

  return (
    <div className="pt-20 pb-32 px-container-padding animate-fade-in">
      <TopBar brand title="Butterfly" right={<Icon name="notifications" className="text-primary" />} />

      <div className="mb-5">
        <h2 className="font-headline-lg text-[26px] font-bold text-on-surface">Trilha de Aprendizado</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Seu espaço para conhecimento e evolução pessoal.
        </p>
      </div>

      {/* Módulo principal */}
      <div className="surface-card overflow-hidden mb-5">
        <div className="h-44 w-full bg-surface-container-high relative">
          <img src={MAIN_MODULE.cover} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="p-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed/60 px-3 py-1 font-label-md text-[12px] text-on-secondary-fixed-variant mb-3">
            <Icon name="hub" fill className="text-[14px]" /> {MAIN_MODULE.tag}
          </span>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{MAIN_MODULE.title}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{MAIN_MODULE.description}</p>

          <div className="flex justify-between items-center mb-2">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Progresso: {MAIN_MODULE.completedLessons}/{MAIN_MODULE.totalLessons} Aulas
            </span>
            <span className="font-label-md text-label-md text-primary">{Math.round(progressRatio * 100)}%</span>
          </div>
          <ProgressBar ratio={progressRatio} className="mb-4" />

          <Button fullWidth icon="play_arrow">
            Continuar Assistindo
          </Button>
        </div>
      </div>

      {/* Materiais complementares */}
      <div className="rounded-xl bg-primary-container/15 border border-primary-container/30 p-5 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mb-3">
          <Icon name="menu_book" fill className="text-on-primary text-[20px]" />
        </div>
        <h3 className="font-headline-md text-[20px] text-on-surface mb-1">Materiais Complementares</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
          Baixe nossos e-books e guias práticos para aprofundar seu conhecimento e aplicar no dia a dia.
        </p>
        <div className="flex flex-col gap-2">
          {EBOOKS.map((e) => (
            <button
              key={e.id}
              className="flex items-center justify-between rounded-xl bg-surface-container-lowest border border-outline-variant px-4 py-3 hover:border-primary transition-colors active:scale-[0.99]"
            >
              <span className="flex items-center gap-3">
                <Icon name="picture_as_pdf" className="text-secondary text-[22px]" />
                <span className="font-label-md text-label-md text-on-surface">{e.title}</span>
              </span>
              <Icon name="download" className="text-on-surface-variant" />
            </button>
          ))}
        </div>
      </div>

      <LessonGroup icon="restaurant" title="Guia de Alimentos" lessons={NUTRITION_LESSONS} />
      <LessonGroup icon="emoji_food_beverage" title="Receitas Butterfly" lessons={RECIPE_LESSONS} />
    </div>
  )
}

function LessonGroup({ icon, title, lessons }: { icon: string; title: string; lessons: Lesson[] }) {
  return (
    <section className="mb-6">
      <h3 className="font-headline-md text-[22px] text-on-surface mb-3 flex items-center gap-2">
        <Icon name={icon} fill className="text-secondary text-[22px]" /> {title}
      </h3>
      <div className="flex flex-col gap-3">
        {lessons.map((l) => (
          <button
            key={l.id}
            className="flex gap-3 surface-card p-3 text-left hover:border-primary-container transition-colors active:scale-[0.99]"
          >
            <img src={l.thumbnail} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-label-md text-label-md text-on-surface truncate">{l.title}</span>
                {l.done && <Icon name="check_circle" fill className="text-primary text-[16px] shrink-0" />}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{l.description}</p>
              <span className="flex items-center gap-1 font-body-sm text-[12px] text-on-surface-variant mt-1">
                <Icon name="schedule" className="text-[14px]" /> {l.duration}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
