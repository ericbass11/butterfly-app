import { useEffect, useMemo, useState } from 'react'
import { TopBar } from '@/components/TopBar'
import { Icon } from '@/components/Icon'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/Button'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import * as db from '@/lib/db'
import { demoContent } from '@/data/lessons'
import { clsx } from '@/lib/utils'

const CATEGORY_META: Record<string, { title: string; icon: string }> = {
  nutrition: { title: 'Guia de Alimentos', icon: 'restaurant' },
  recipe: { title: 'Receitas Butterfly', icon: 'emoji_food_beverage' },
  mind: { title: 'Mente & Mindfulness', icon: 'self_improvement' },
}
const CATEGORY_ORDER = ['nutrition', 'recipe', 'mind']

/** Área de Membros — Trilha de Aprendizado (RF07), agora vinda do banco. */
export function Members() {
  const { profile } = useAuth()
  const userId = profile?.id ?? null

  const [modules, setModules] = useState<db.DbModule[]>([])
  const [lessons, setLessons] = useState<db.DbLesson[]>([])
  const [ebooks, setEbooks] = useState<db.DbEbook[]>([])
  const [done, setDone] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured || !userId) {
      const demo = demoContent()
      setModules(demo.modules)
      setLessons(demo.lessons)
      setEbooks(demo.ebooks)
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const [mods, less, ebs, doneIds] = await Promise.all([
          db.listModules(),
          db.listLessons(),
          db.listEbooks(),
          db.getDoneLessonIds(userId),
        ])
        if (!active) return
        setModules(mods)
        setLessons(less)
        setEbooks(ebs)
        setDone(doneIds)
      } catch {
        const demo = demoContent()
        if (active) {
          setModules(demo.modules)
          setLessons(demo.lessons)
          setEbooks(demo.ebooks)
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [userId])

  function toggleDone(lessonId: string) {
    setDone((prev) => {
      const next = new Set(prev)
      const willBeDone = !next.has(lessonId)
      if (willBeDone) next.add(lessonId)
      else next.delete(lessonId)
      if (isSupabaseConfigured && userId) db.setLessonDone(userId, lessonId, willBeDone).catch(() => {})
      return next
    })
  }

  const featured = modules[0]
  const featuredLessons = useMemo(
    () => (featured ? lessons.filter((l) => l.moduleSlug === featured.slug) : []),
    [lessons, featured],
  )
  const featuredDone = featuredLessons.filter((l) => done.has(l.id)).length
  const featuredRatio = featuredLessons.length ? featuredDone / featuredLessons.length : 0

  return (
    <div className="pt-20 pb-32 px-container-padding animate-fade-in">
      <TopBar brand title="Butterfly" right={<Icon name="notifications" className="text-primary" />} />

      <div className="mb-5">
        <h2 className="font-headline-lg text-[26px] font-bold text-on-surface">Trilha de Aprendizado</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Seu espaço para conhecimento e evolução pessoal.
        </p>
      </div>

      {loading && <div className="surface-card h-64 animate-pulse bg-surface-container-low mb-5" />}

      {/* Módulo em destaque */}
      {featured && (
        <div className="surface-card overflow-hidden mb-5">
          <div className="h-44 w-full bg-surface-container-high relative">
            {featured.cover && <img src={featured.cover} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="p-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed/60 px-3 py-1 font-label-md text-[12px] text-on-secondary-fixed-variant mb-3">
              <Icon name="hub" fill className="text-[14px]" /> {featured.tag}
            </span>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{featured.title}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">{featured.description}</p>

            <div className="flex justify-between items-center mb-2">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Progresso: {featuredDone}/{featuredLessons.length} Aulas
              </span>
              <span className="font-label-md text-label-md text-primary">
                {Math.round(featuredRatio * 100)}%
              </span>
            </div>
            <ProgressBar ratio={featuredRatio} className="mb-4" />

            {featuredLessons.length > 0 && (
              <div className="flex flex-col gap-2 mb-4">
                {featuredLessons.map((l) => (
                  <LessonRow key={l.id} l={l} done={done.has(l.id)} onToggle={() => toggleDone(l.id)} compact />
                ))}
              </div>
            )}

            <Button fullWidth icon="play_arrow">
              Continuar Assistindo
            </Button>
          </div>
        </div>
      )}

      {/* Materiais complementares */}
      {ebooks.length > 0 && (
        <div className="rounded-xl bg-primary-container/15 border border-primary-container/30 p-5 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mb-3">
            <Icon name="menu_book" fill className="text-on-primary text-[20px]" />
          </div>
          <h3 className="font-headline-md text-[20px] text-on-surface mb-1">Materiais Complementares</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
            Baixe nossos e-books e guias práticos para aprofundar seu conhecimento.
          </p>
          <div className="flex flex-col gap-2">
            {ebooks.map((e) => (
              <button
                key={e.id}
                className="flex items-center justify-between rounded-xl bg-surface-container-lowest border border-outline-variant px-4 py-3 hover:border-primary transition-colors active:scale-[0.99]"
              >
                <span className="flex items-center gap-3">
                  <Icon name="picture_as_pdf" className="text-secondary text-[22px]" />
                  <span className="font-label-md text-label-md text-on-surface text-left">{e.title}</span>
                </span>
                <Icon name="download" className="text-on-surface-variant" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grupos por categoria */}
      {CATEGORY_ORDER.map((cat) => {
        const items = lessons.filter((l) => l.category === cat)
        if (items.length === 0) return null
        const meta = CATEGORY_META[cat]
        return (
          <section key={cat} className="mb-6">
            <h3 className="font-headline-md text-[22px] text-on-surface mb-3 flex items-center gap-2">
              <Icon name={meta.icon} fill className="text-secondary text-[22px]" /> {meta.title}
            </h3>
            <div className="flex flex-col gap-3">
              {items.map((l) => (
                <LessonRow key={l.id} l={l} done={done.has(l.id)} onToggle={() => toggleDone(l.id)} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function LessonRow({
  l,
  done,
  onToggle,
  compact,
}: {
  l: db.DbLesson
  done: boolean
  onToggle: () => void
  compact?: boolean
}) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'flex gap-3 text-left transition-all active:scale-[0.99]',
        compact
          ? 'items-center rounded-lg p-2 hover:bg-surface-container-low'
          : 'surface-card p-3 hover:border-primary-container',
      )}
    >
      {!compact && l.thumbnail && (
        <img src={l.thumbnail} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
      )}
      {compact && (
        <span
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors',
            done ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant text-outline',
          )}
        >
          <Icon name={done ? 'check' : 'play_arrow'} fill className="text-[18px]" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-label-md text-label-md text-on-surface truncate">{l.title}</span>
          {!compact && done && <Icon name="check_circle" fill className="text-primary text-[16px] shrink-0" />}
        </div>
        {!compact && (
          <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">{l.description}</p>
        )}
        <span className="flex items-center gap-1 font-body-sm text-[12px] text-on-surface-variant mt-1">
          <Icon name="schedule" className="text-[14px]" /> {l.duration}
          {compact && done && <span className="text-primary ml-1">· concluída</span>}
        </span>
      </div>
    </button>
  )
}
