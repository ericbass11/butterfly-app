import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { TopBar } from '@/components/TopBar'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { Role } from '@/lib/types'
import * as db from '@/lib/db'
import { clsx } from '@/lib/utils'
import { demoContent } from '@/data/lessons'
import { KNOWLEDGE_BASE } from '@/data/knowledge'

type Tab = 'lessons' | 'ebooks' | 'knowledge' | 'modules' | 'users'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'lessons', label: 'Aulas', icon: 'play_circle' },
  { key: 'ebooks', label: 'E-books', icon: 'menu_book' },
  { key: 'knowledge', label: 'IA', icon: 'smart_toy' },
  { key: 'modules', label: 'Módulos', icon: 'hub' },
  { key: 'users', label: 'Usuárias', icon: 'group' },
]

const CATEGORY_OPTS = [
  { value: 'module', label: 'Módulo principal' },
  { value: 'nutrition', label: 'Guia de Alimentos' },
  { value: 'recipe', label: 'Receitas' },
  { value: 'mind', label: 'Mente & Mindfulness' },
]

export function AdminManage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'lessons'

  return (
    <div className="pt-20 pb-32 px-container-padding animate-fade-in">
      <TopBar showBack title="Gestão de Conteúdo" subtitle="Editar tudo pelo app" />

      {/* Abas */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-container-padding px-container-padding mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setParams({ tab: t.key })}
            className={clsx(
              'shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-all active:scale-95',
              tab === t.key
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant',
            )}
          >
            <Icon name={t.icon} fill={tab === t.key} className="text-[18px]" /> {t.label}
          </button>
        ))}
      </div>

      {!isSupabaseConfigured && (
        <div className="flex items-center gap-2 rounded-xl bg-secondary-fixed/40 text-on-secondary-fixed-variant px-4 py-3 font-body-sm text-body-sm mb-5">
          <Icon name="cloud_off" className="text-[18px] shrink-0" />
          Modo demonstração: conecte o Supabase para editar o conteúdo de verdade.
        </div>
      )}

      {tab === 'lessons' && <LessonsTab />}
      {tab === 'ebooks' && <EbooksTab />}
      {tab === 'knowledge' && <KnowledgeTab />}
      {tab === 'modules' && <ModulesTab />}
      {tab === 'users' && <UsersTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers de UI
// ---------------------------------------------------------------------------

function useAsyncList<T>(loader: () => Promise<T[]>, deps: unknown[] = []) {
  const [items, setItems] = useState<T[] | null>(null)
  const [error, setError] = useState(false)
  const reload = useCallback(() => {
    setItems(null)
    setError(false)
    loader()
      .then(setItems)
      .catch(() => setError(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(reload, [reload])
  return { items, error, reload }
}

function ListShell({
  title,
  onAdd,
  children,
  loading,
  error,
  empty,
}: {
  title: string
  onAdd?: () => void
  children: ReactNode
  loading: boolean
  error: boolean
  empty: boolean
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-headline-md text-[20px] text-on-surface">{title}</h3>
        {onAdd && (
          <Button icon="add" onClick={onAdd} className="!min-h-[40px] !px-4">
            Adicionar
          </Button>
        )}
      </div>
      {loading && <div className="surface-card h-24 animate-pulse bg-surface-container-low" />}
      {error && <p className="font-body-sm text-body-sm text-error">Não foi possível carregar.</p>}
      {!loading && !error && empty && (
        <p className="font-body-sm text-body-sm text-on-surface-variant">Nada cadastrado ainda.</p>
      )}
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

function Row({
  title,
  subtitle,
  onEdit,
  onDelete,
  leading,
}: {
  title: string
  subtitle?: string
  onEdit: () => void
  onDelete: () => void
  leading?: ReactNode
}) {
  return (
    <div className="surface-card p-3 flex items-center gap-3">
      {leading}
      <button onClick={onEdit} className="flex-1 min-w-0 text-left">
        <span className="font-label-md text-label-md text-on-surface block truncate">{title}</span>
        {subtitle && (
          <span className="font-body-sm text-body-sm text-on-surface-variant block truncate">{subtitle}</span>
        )}
      </button>
      <button onClick={onEdit} className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high" aria-label="Editar">
        <Icon name="edit" className="text-[20px]" />
      </button>
      <button onClick={onDelete} className="w-9 h-9 rounded-full flex items-center justify-center text-error hover:bg-error-container/50" aria-label="Excluir">
        <Icon name="delete" className="text-[20px]" />
      </button>
    </div>
  )
}

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select'
  options?: { value: string; label: string }[]
  placeholder?: string
}

function FormModal({
  title,
  fields,
  initial,
  onSave,
  onClose,
}: {
  title: string
  fields: FieldDef[]
  initial: Record<string, string>
  onSave: (values: Record<string, string>) => Promise<void>
  onClose: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await onSave(values)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-inverse-surface/30 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0 mx-auto max-w-[520px] bg-surface flex flex-col">
        <div className="flex items-center gap-2 px-2 h-16 pt-safe border-b border-outline-variant/60 shrink-0">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high active:scale-95" aria-label="Voltar">
            <Icon name="arrow_back" />
          </button>
          <span className="font-label-md text-label-md text-on-surface-variant">{title}</span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-container-padding flex flex-col gap-4">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">{f.label}</span>
              {f.type === 'textarea' ? (
                <textarea
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  rows={f.key === 'content' ? 6 : 3}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 outline-none font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                />
              ) : f.type === 'select' ? (
                <select
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 h-[52px] outline-none font-body-md text-body-md text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 h-[52px] outline-none font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              )}
            </label>
          ))}
          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-error-container/50 text-on-error-container px-4 py-3 font-body-sm text-body-sm">
              <Icon name="error" fill className="text-[18px] shrink-0" /> {error}
            </p>
          )}
        </div>

        <div className="p-container-padding border-t border-outline-variant/60 pb-safe shrink-0">
          <Button fullWidth icon={saving ? 'progress_activity' : 'save'} onClick={save} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function confirmDelete(label: string): boolean {
  return window.confirm(`Excluir "${label}"? Esta ação não pode ser desfeita.`)
}

// ---------------------------------------------------------------------------
// Aulas
// ---------------------------------------------------------------------------

function LessonsTab() {
  const { items, error, reload } = useAsyncList<db.DbLesson>(() =>
    isSupabaseConfigured ? db.listLessons() : Promise.resolve(demoContent().lessons),
  )
  const [modules, setModules] = useState<db.DbModule[]>([])
  const [editing, setEditing] = useState<db.DbLesson | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    db.listModules().then(setModules).catch(() => {})
  }, [])

  const moduleOpts = useMemo(
    () => [{ value: '', label: '— nenhum —' }, ...modules.map((m) => ({ value: m.slug, label: m.title }))],
    [modules],
  )

  const fields: FieldDef[] = [
    { key: 'title', label: 'Título', type: 'text', placeholder: 'Nome da aula' },
    { key: 'category', label: 'Categoria', type: 'select', options: CATEGORY_OPTS },
    { key: 'moduleSlug', label: 'Módulo (opcional)', type: 'select', options: moduleOpts },
    { key: 'duration', label: 'Duração', type: 'text', placeholder: 'Ex: 12:30' },
    { key: 'videoUrl', label: 'Link do vídeo (YouTube)', type: 'text', placeholder: 'https://www.youtube.com/watch?v=...' },
    { key: 'thumbnail', label: 'Imagem (URL)', type: 'text', placeholder: 'https://...' },
    { key: 'description', label: 'Descrição curta', type: 'textarea' },
    { key: 'content', label: 'Conteúdo da aula (texto)', type: 'textarea' },
  ]

  function toInput(v: Record<string, string>): db.LessonInput {
    return {
      title: v.title?.trim() ?? '',
      category: v.category || 'nutrition',
      moduleSlug: v.moduleSlug ? v.moduleSlug : null,
      description: v.description ?? '',
      duration: v.duration ?? '',
      thumbnail: v.thumbnail ?? '',
      videoUrl: v.videoUrl ?? '',
      content: v.content ?? '',
    }
  }

  return (
    <ListShell
      title="Aulas"
      onAdd={() => setAdding(true)}
      loading={items === null && !error}
      error={error}
      empty={items?.length === 0}
    >
      {items?.map((l) => (
        <Row
          key={l.id}
          title={l.title}
          subtitle={`${CATEGORY_OPTS.find((c) => c.value === l.category)?.label ?? l.category} · ${l.duration}`}
          onEdit={() => setEditing(l)}
          onDelete={() => confirmDelete(l.title) && db.deleteLesson(l.id).then(reload)}
        />
      ))}

      {adding && (
        <FormModal
          title="Nova aula"
          fields={fields}
          initial={{ category: 'nutrition', moduleSlug: '' }}
          onSave={(v) => db.createLesson(toInput(v)).then(reload)}
          onClose={() => setAdding(false)}
        />
      )}
      {editing && (
        <FormModal
          title="Editar aula"
          fields={fields}
          initial={{
            title: editing.title,
            category: editing.category,
            moduleSlug: editing.moduleSlug ?? '',
            duration: editing.duration,
            videoUrl: editing.videoUrl,
            thumbnail: editing.thumbnail,
            description: editing.description,
            content: editing.content,
          }}
          onSave={(v) => db.updateLesson(editing.id, toInput(v)).then(reload)}
          onClose={() => setEditing(null)}
        />
      )}
    </ListShell>
  )
}

// ---------------------------------------------------------------------------
// E-books
// ---------------------------------------------------------------------------

function EbooksTab() {
  const { items, error, reload } = useAsyncList<db.DbEbook>(() =>
    isSupabaseConfigured ? db.listEbooks() : Promise.resolve(demoContent().ebooks),
  )
  const [editing, setEditing] = useState<db.DbEbook | null>(null)
  const [adding, setAdding] = useState(false)

  const fields: FieldDef[] = [
    { key: 'title', label: 'Título', type: 'text', placeholder: 'Nome do e-book' },
    { key: 'format', label: 'Formato', type: 'text', placeholder: 'PDF' },
    { key: 'fileUrl', label: 'Link do arquivo (URL)', type: 'text', placeholder: 'https://...' },
    { key: 'description', label: 'Descrição', type: 'textarea' },
  ]
  const toInput = (v: Record<string, string>): db.EbookInput => ({
    title: v.title?.trim() ?? '',
    description: v.description ?? '',
    format: v.format || 'PDF',
    fileUrl: v.fileUrl ?? '',
  })

  return (
    <ListShell title="E-books" onAdd={() => setAdding(true)} loading={items === null && !error} error={error} empty={items?.length === 0}>
      {items?.map((e) => (
        <Row
          key={e.id}
          title={e.title}
          subtitle={e.format}
          leading={<Icon name="picture_as_pdf" className="text-secondary text-[22px]" />}
          onEdit={() => setEditing(e)}
          onDelete={() => confirmDelete(e.title) && db.deleteEbook(e.id).then(reload)}
        />
      ))}
      {adding && (
        <FormModal title="Novo e-book" fields={fields} initial={{ format: 'PDF' }} onSave={(v) => db.createEbook(toInput(v)).then(reload)} onClose={() => setAdding(false)} />
      )}
      {editing && (
        <FormModal
          title="Editar e-book"
          fields={fields}
          initial={{ title: editing.title, format: editing.format }}
          onSave={(v) => db.updateEbook(editing.id, toInput(v)).then(reload)}
          onClose={() => setEditing(null)}
        />
      )}
    </ListShell>
  )
}

// ---------------------------------------------------------------------------
// Base de conhecimento da IA
// ---------------------------------------------------------------------------

function KnowledgeTab() {
  const { items, error, reload } = useAsyncList<db.KnowledgeRow>(() =>
    isSupabaseConfigured
      ? db.listKnowledgeAll()
      : Promise.resolve(
          KNOWLEDGE_BASE.map((k, i) => ({
            id: `demo-${i}`,
            category: '',
            keywords: k.keywords,
            answer: k.answer,
            tip: k.tip ?? '',
          })),
        ),
  )
  const [editing, setEditing] = useState<db.KnowledgeRow | null>(null)
  const [adding, setAdding] = useState(false)

  const fields: FieldDef[] = [
    { key: 'keywords', label: 'Palavras-chave (separadas por vírgula)', type: 'text', placeholder: 'pão, paes, padaria' },
    { key: 'category', label: 'Categoria', type: 'text', placeholder: 'alimentos' },
    { key: 'answer', label: 'Resposta da IA', type: 'textarea' },
    { key: 'tip', label: 'Dica Butterfly (opcional)', type: 'textarea' },
  ]
  const toInput = (v: Record<string, string>): db.KnowledgeInput => ({
    category: v.category ?? '',
    keywords: (v.keywords ?? '').split(',').map((k) => k.trim()).filter(Boolean),
    answer: v.answer ?? '',
    tip: v.tip ?? '',
  })

  return (
    <ListShell title="Base de Conhecimento (IA)" onAdd={() => setAdding(true)} loading={items === null && !error} error={error} empty={items?.length === 0}>
      {items?.map((k) => (
        <Row
          key={k.id}
          title={k.keywords.join(', ') || '(sem palavras-chave)'}
          subtitle={k.answer}
          leading={<Icon name="smart_toy" className="text-secondary text-[22px]" />}
          onEdit={() => setEditing(k)}
          onDelete={() => confirmDelete(k.keywords[0] ?? 'entrada') && db.deleteKnowledge(k.id).then(reload)}
        />
      ))}
      {adding && (
        <FormModal title="Nova resposta" fields={fields} initial={{}} onSave={(v) => db.createKnowledge(toInput(v)).then(reload)} onClose={() => setAdding(false)} />
      )}
      {editing && (
        <FormModal
          title="Editar resposta"
          fields={fields}
          initial={{ keywords: editing.keywords.join(', '), category: editing.category, answer: editing.answer, tip: editing.tip }}
          onSave={(v) => db.updateKnowledge(editing.id, toInput(v)).then(reload)}
          onClose={() => setEditing(null)}
        />
      )}
    </ListShell>
  )
}

// ---------------------------------------------------------------------------
// Módulos
// ---------------------------------------------------------------------------

function ModulesTab() {
  const { items, error, reload } = useAsyncList<db.DbModule>(() =>
    isSupabaseConfigured ? db.listModules() : Promise.resolve(demoContent().modules),
  )
  const [editing, setEditing] = useState<db.DbModule | null>(null)
  const [adding, setAdding] = useState(false)

  const fields: FieldDef[] = [
    { key: 'title', label: 'Título', type: 'text', placeholder: 'Nome do módulo' },
    { key: 'tag', label: 'Selo', type: 'text', placeholder: 'Módulo Principal' },
    { key: 'cover', label: 'Capa (URL)', type: 'text', placeholder: 'https://...' },
    { key: 'description', label: 'Descrição', type: 'textarea' },
  ]
  const toInput = (v: Record<string, string>): db.ModuleInput => ({
    title: v.title?.trim() ?? '',
    description: v.description ?? '',
    tag: v.tag || 'Módulo',
    cover: v.cover ?? '',
  })

  return (
    <ListShell title="Módulos" onAdd={() => setAdding(true)} loading={items === null && !error} error={error} empty={items?.length === 0}>
      {items?.map((m) => (
        <Row
          key={m.id}
          title={m.title}
          subtitle={m.tag}
          leading={<Icon name="hub" className="text-secondary text-[22px]" />}
          onEdit={() => setEditing(m)}
          onDelete={() => confirmDelete(m.title) && db.deleteModule(m.id).then(reload)}
        />
      ))}
      {adding && (
        <FormModal title="Novo módulo" fields={fields} initial={{ tag: 'Módulo' }} onSave={(v) => db.createModule(toInput(v)).then(reload)} onClose={() => setAdding(false)} />
      )}
      {editing && (
        <FormModal
          title="Editar módulo"
          fields={fields}
          initial={{ title: editing.title, tag: editing.tag, cover: editing.cover, description: editing.description }}
          onSave={(v) => db.updateModule(editing.id, toInput(v)).then(reload)}
          onClose={() => setEditing(null)}
        />
      )}
    </ListShell>
  )
}

// ---------------------------------------------------------------------------
// Usuárias (gestão de papel)
// ---------------------------------------------------------------------------

const ROLE_OPTS: { value: Role; label: string }[] = [
  { value: 'patient', label: 'Paciente' },
  { value: 'partner', label: 'Parceiro' },
  { value: 'admin', label: 'Admin' },
]

function UsersTab() {
  const { items, error, reload } = useAsyncList<db.ManagedUser>(() =>
    isSupabaseConfigured
      ? db.listAllProfiles()
      : Promise.resolve([
          { id: 'demo', name: 'Você (demo)', email: 'demo@butterfly.app', role: 'admin' as Role, createdAt: new Date().toISOString() },
        ]),
  )

  async function changeRole(id: string, role: Role) {
    try {
      await db.updateUserRole(id, role)
      reload()
    } catch {
      /* ignore */
    }
  }

  return (
    <ListShell title="Usuárias" loading={items === null && !error} error={error} empty={items?.length === 0}>
      {items?.map((u) => (
        <div key={u.id} className="surface-card p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
            <Icon name="person" fill className="text-secondary text-[20px]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-label-md text-label-md text-on-surface block truncate">{u.name || 'Sem nome'}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant block truncate">{u.email}</span>
          </div>
          <select
            value={u.role}
            onChange={(e) => changeRole(u.id, e.target.value as Role)}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 h-10 font-label-md text-[13px] text-on-surface outline-none focus:border-primary"
          >
            {ROLE_OPTS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </ListShell>
  )
}
