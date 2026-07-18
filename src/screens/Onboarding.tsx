import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { clsx } from '@/lib/utils'
import { emptyAnamnese, GOALS, triage } from '@/lib/anamnese'
import type { Anamnese, TriageResult } from '@/lib/types'
import { store, createInitialProgram } from '@/lib/store'
import { triggerAutomation } from '@/lib/supabase'
import { RiskBlocked } from './RiskBlocked'

type Step = 'welcome' | 'form' | 'result'

const highlights = [
  { icon: 'calendar_month', title: '45 Dias', text: 'Um passo de cada vez, construindo novos hábitos sustentáveis.' },
  { icon: 'restaurant', title: 'Nutrição', text: 'Guias alimentares focados em vitalidade e clareza mental.' },
  { icon: 'psychology', title: 'Mente', text: 'Exercícios de mindfulness e bem-estar emocional.' },
]

export function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('welcome')
  const [form, setForm] = useState<Anamnese>(emptyAnamnese)
  const [result, setResult] = useState<TriageResult | null>(null)

  function update<K extends keyof Anamnese>(key: K, value: Anamnese[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function submitAnamnese(e: React.FormEvent) {
    e.preventDefault()
    const r = triage(form)
    setResult(r)
    store.setAnamnese(form)
    void triggerAutomation('anamnese_submitted', { goal: form.goal, risk: r.level })
    setStep('result')
  }

  function enterProgram() {
    store.setOnboarded(true)
    if (!store.getProgram()) store.setProgram(createInitialProgram())
    void triggerAutomation('protocol_unlocked', {})
    navigate('/app', { replace: true })
  }

  if (step === 'result' && result?.level === 'blocked') {
    return <RiskBlocked reasons={result.reasons} />
  }

  return (
    <div className="mx-auto max-w-[520px] min-h-dvh flex flex-col px-container-padding pt-safe pb-8">
      {/* Header simples */}
      <div className="flex items-center justify-between h-16">
        <span className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-1.5">
          <Icon name="eco" fill className="text-[22px]" /> Butterfly
        </span>
        <Icon name="help" className="text-on-surface-variant" />
      </div>

      {step === 'welcome' && (
        <WelcomeStep onStart={() => setStep('form')} />
      )}

      {step === 'form' && (
        <AnamneseForm form={form} update={update} onSubmit={submitAnamnese} />
      )}

      {step === 'result' && result && result.level !== 'blocked' && (
        <ResultStep result={result} onContinue={enterProgram} />
      )}
    </div>
  )
}

function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      <div className="flex flex-col items-center text-center mt-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center shadow-ambient-lg mb-6">
          <Icon name="spa" fill className="text-on-primary text-[40px]" />
        </div>
        <h1 className="font-headline-xl text-[36px] leading-[42px] font-bold text-primary tracking-tight">
          Bem-vindo à sua jornada
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-4">
          Estamos felizes em ter você aqui. Para personalizar seu protocolo de 45 dias, precisamos
          conhecer um pouco mais sobre sua saúde atual.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {highlights.map((h) => (
          <div key={h.title} className="glass-card rounded-xl p-md text-center">
            <Icon name={h.icon} fill className="text-primary text-[28px]" />
            <h3 className="font-headline-md text-[20px] text-on-surface mt-2 mb-1">{h.title}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{h.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <Button fullWidth iconRight="arrow_forward" onClick={onStart}>
          Começar Triagem
        </Button>
      </div>
    </div>
  )
}

interface FormProps {
  form: Anamnese
  update: <K extends keyof Anamnese>(key: K, value: Anamnese[K]) => void
  onSubmit: (e: React.FormEvent) => void
}

function AnamneseForm({ form, update, onSubmit }: FormProps) {
  const conditions: { key: keyof Anamnese; label: string; hint: string }[] = [
    { key: 'hasDiabetes', label: 'Diabetes', hint: 'Tipo 1 ou 2' },
    { key: 'hasHypertension', label: 'Hipertensão', hint: 'Pressão alta' },
    { key: 'isPregnant', label: 'Gestante / amamentando', hint: '' },
    { key: 'eatingDisorderHistory', label: 'Histórico de transtorno alimentar', hint: '' },
  ]

  return (
    <form onSubmit={onSubmit} className="flex-1 flex flex-col animate-fade-in pb-4">
      <h2 className="font-headline-lg text-[28px] font-bold text-on-surface mt-2 mb-1">Anamnese</h2>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6">
        Suas respostas garantem um protocolo seguro. Dados de saúde são protegidos (LGPD).
      </p>

      <label className="block mb-5">
        <span className="font-label-md text-label-md text-on-surface-variant mb-2 block">
          Qual seu principal objetivo?
        </span>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => update('goal', g)}
              className={clsx(
                'rounded-full px-4 py-2 font-label-md text-[13px] border transition-all active:scale-95',
                form.goal === g
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-secondary-fixed/40 text-on-secondary-fixed-variant border-transparent',
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </label>

      <label className="block mb-5">
        <span className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">Idade</span>
        <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 h-[52px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Icon name="cake" className="text-on-surface-variant text-[20px]" />
          <input
            type="number"
            min={12}
            max={99}
            required
            value={form.age || ''}
            onChange={(e) => update('age', Number(e.target.value))}
            placeholder="Ex: 34"
            className="flex-1 bg-transparent outline-none font-body-md text-body-md text-on-surface placeholder:text-outline"
          />
        </div>
      </label>

      <span className="font-label-md text-label-md text-on-surface-variant mb-2 block">
        Você possui alguma dessas condições?
      </span>
      <div className="flex flex-col gap-2.5 mb-5">
        {conditions.map((c) => {
          const active = form[c.key] as boolean
          return (
            <button
              type="button"
              key={c.key}
              onClick={() => update(c.key, !active as never)}
              className={clsx(
                'flex items-center justify-between rounded-xl border p-4 text-left transition-all active:scale-[0.99]',
                active
                  ? 'border-error/40 bg-error-container/40'
                  : 'border-outline-variant bg-surface-container-lowest',
              )}
            >
              <span>
                <span className="font-label-md text-label-md text-on-surface block">{c.label}</span>
                {c.hint && <span className="font-body-sm text-body-sm text-on-surface-variant">{c.hint}</span>}
              </span>
              <span
                className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors',
                  active ? 'bg-error border-error text-on-error' : 'border-outline-variant text-transparent',
                )}
              >
                <Icon name="check" className="text-[16px]" />
              </span>
            </button>
          )
        })}
      </div>

      <label className="block mb-6">
        <span className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">
          Medicações em uso (opcional)
        </span>
        <textarea
          value={form.medications}
          onChange={(e) => update('medications', e.target.value)}
          rows={2}
          placeholder="Liste medicações contínuas, se houver."
          className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 outline-none font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
        />
      </label>

      <Button type="submit" fullWidth iconRight="verified" className="mt-auto">
        Concluir triagem
      </Button>
    </form>
  )
}

function ResultStep({ result, onContinue }: { result: TriageResult; onContinue: () => void }) {
  const attention = result.level === 'attention'
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center animate-pop py-8">
      <div
        className={clsx(
          'w-24 h-24 rounded-full flex items-center justify-center shadow-ambient-lg mb-6',
          attention ? 'bg-secondary-container' : 'bg-primary-container',
        )}
      >
        <Icon
          name={attention ? 'info' : 'verified'}
          fill
          className={clsx('text-[48px]', attention ? 'text-secondary' : 'text-on-primary')}
        />
      </div>
      <h2 className="font-headline-lg text-[28px] font-bold text-on-surface mb-2">
        {attention ? 'Tudo certo, com atenção' : 'Protocolo liberado!'}
      </h2>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-6">
        {attention
          ? 'Você pode iniciar sua jornada. Fique atenta aos pontos abaixo e, na dúvida, fale com um profissional parceiro.'
          : 'Sua triagem não apontou riscos. Sua jornada de metamorfose está pronta para começar.'}
      </p>

      {result.reasons.length > 0 && (
        <div className="w-full glass-card rounded-xl p-4 text-left mb-6">
          <ul className="flex flex-col gap-2">
            {result.reasons.map((r) => (
              <li key={r} className="flex gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <Icon name="arrow_right" className="text-secondary text-[18px] shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button fullWidth iconRight="arrow_forward" onClick={onContinue}>
        Ir para o Dashboard
      </Button>
    </div>
  )
}
