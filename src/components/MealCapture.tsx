import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import { Icon } from './Icon'
import { fileToDataUrl } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (dataUrl: string, note: string) => Promise<void> | void
}

/** Modal de upload de evidência da refeição (RF05). */
export function MealCapture({ open, onClose, onSave }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(await fileToDataUrl(file))
  }

  function reset() {
    setPreview(null)
    setNote('')
    setError(null)
  }

  async function save() {
    if (!preview || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave(preview, note.trim())
      reset()
      onClose()
    } catch {
      setError('Não foi possível salvar a foto. Verifique o bucket de Storage e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-inverse-surface/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-[520px] bg-surface rounded-t-2xl p-container-padding pb-safe shadow-ambient-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-md text-[20px] font-semibold text-on-surface">Registrar refeição</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high" aria-label="Fechar">
            <Icon name="close" />
          </button>
        </div>

        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />

        {preview ? (
          <img src={preview} alt="Prévia da refeição" className="w-full h-56 object-cover rounded-xl mb-4" />
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-56 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-on-surface-variant gap-2 mb-4 hover:border-primary transition-colors"
          >
            <Icon name="add_a_photo" className="text-[40px] text-primary" />
            <span className="font-label-md text-label-md">Tirar foto ou escolher da galeria</span>
          </button>
        )}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Adicione uma nota (opcional): o que você comeu?"
          className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 outline-none font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none mb-4"
        />

        {error && (
          <p className="flex items-center gap-2 rounded-xl bg-error-container/50 text-on-error-container px-4 py-3 font-body-sm text-body-sm mb-3">
            <Icon name="error" fill className="text-[18px] shrink-0" /> {error}
          </p>
        )}

        <div className="flex gap-3">
          {preview && !saving && (
            <Button variant="ghost" icon="refresh" onClick={() => inputRef.current?.click()}>
              Trocar
            </Button>
          )}
          <Button fullWidth icon={saving ? 'progress_activity' : 'check'} onClick={save} disabled={!preview || saving}>
            {saving ? 'Salvando…' : 'Salvar e pontuar'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
