import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { triggerAutomation } from '@/lib/supabase'

/**
 * Caminho B do User Flow (RF02): risco detectado.
 * Tela bloqueada informando a necessidade de vínculo com o Médico Parceiro
 * antes de liberar o protocolo restritivo. No MVP, o conteúdo educativo é
 * liberado (a anamnese é registrada com risk_level = blocked).
 */
export function RiskBlocked({
  reasons,
  onEnter,
  saving,
}: {
  reasons: string[]
  onEnter: (target?: string) => void
  saving: boolean
}) {
  function requestPartner() {
    void triggerAutomation('partner_link_requested', { reasons })
    onEnter('/app')
  }

  return (
    <div className="mx-auto max-w-[520px] min-h-dvh flex flex-col px-container-padding pt-safe pb-8">
      <div className="flex items-center h-16">
        <span className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-1.5">
          <Icon name="eco" fill className="text-[22px]" /> Butterfly
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-error-container flex items-center justify-center shadow-ambient-lg mb-6">
          <Icon name="health_and_safety" fill className="text-error text-[48px]" />
        </div>
        <h1 className="font-headline-lg text-[28px] font-bold text-on-surface mb-3">
          Um passo importante antes de começar
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-6">
          Sua segurança vem primeiro. Identificamos condições que exigem o acompanhamento de um
          <strong> Profissional Parceiro</strong> antes de liberar o protocolo restritivo de 45 dias.
        </p>

        <div className="w-full surface-card p-4 text-left mb-6">
          <span className="font-label-md text-label-md text-error mb-2 flex items-center gap-1.5">
            <Icon name="warning" fill className="text-[18px]" /> Motivos identificados
          </span>
          <ul className="flex flex-col gap-2">
            {reasons.map((r) => (
              <li key={r} className="flex gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <Icon name="arrow_right" className="text-error text-[18px] shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full flex flex-col gap-3 mt-auto">
          <Button fullWidth icon="calendar_add_on" onClick={requestPartner} disabled={saving}>
            {saving ? 'Registrando…' : 'Agendar com Médico Parceiro'}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            icon="menu_book"
            onClick={() => onEnter('/app/educacao')}
            disabled={saving}
          >
            Acessar conteúdo educativo
          </Button>
        </div>
      </div>
    </div>
  )
}
