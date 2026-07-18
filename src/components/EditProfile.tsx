import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useProgram } from '@/context/ProgramContext'
import { Button } from './Button'
import { Icon } from './Icon'
import { UserAvatar } from './UserAvatar'
import { isSupabaseConfigured } from '@/lib/supabase'
import * as db from '@/lib/db'
import { fileToDataUrl } from '@/lib/utils'
import { backdropVariants, sheetVariants } from '@/lib/motion'

/** Personalização da conta: nome e foto de perfil. */
export function EditProfile({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, updateProfile } = useAuth()
  const { program } = useProgram()
  const inputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(profile?.name ?? '')
  const [preview, setPreview] = useState<string | null>(null) // nova foto (data URL) escolhida
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(await fileToDataUrl(file))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const patch: { name: string; avatarUrl?: string } = { name: name.trim() || 'Convidada' }
      if (preview) {
        patch.avatarUrl =
          isSupabaseConfigured && profile ? await db.uploadAvatar(profile.id, preview) : preview
      }
      updateProfile(patch)
      onClose()
    } catch {
      setError('Não foi possível salvar. Verifique o bucket de avatars e tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  const shownPhoto = preview ?? profile?.avatarUrl

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-[80] bg-inverse-surface/30 backdrop-blur-sm"
        >
          <motion.div
            variants={sheetVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 mx-auto max-w-[520px] bg-surface flex flex-col"
          >
            <div className="flex items-center gap-2 px-2 h-16 pt-safe border-b border-outline-variant/60 shrink-0">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high active:scale-95"
                aria-label="Voltar"
              >
                <Icon name="arrow_back" />
              </button>
              <span className="font-label-md text-label-md text-on-surface-variant">Editar perfil</span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-container-padding">
              <input ref={inputRef} type="file" accept="image/*" onChange={pick} className="hidden" />

              {/* Foto */}
              <div className="flex flex-col items-center mb-8 mt-2">
                <button onClick={() => inputRef.current?.click()} className="relative active:scale-95 transition-transform">
                  <UserAvatar stage={program.stage} photoUrl={shownPhoto} size="lg" showStage={false} />
                  <span className="absolute bottom-1 right-1 w-11 h-11 rounded-full bg-primary flex items-center justify-center border-2 border-surface shadow-ambient">
                    <Icon name="photo_camera" fill className="text-on-primary text-[22px]" />
                  </span>
                </button>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="mt-3 font-label-md text-label-md text-primary"
                >
                  {shownPhoto ? 'Trocar foto' : 'Adicionar foto'}
                </button>
              </div>

              {/* Nome */}
              <label className="block">
                <span className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">Nome</span>
                <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 h-[52px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <Icon name="badge" className="text-on-surface-variant text-[20px]" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="flex-1 bg-transparent outline-none font-body-md text-body-md text-on-surface placeholder:text-outline"
                  />
                </div>
              </label>

              {profile?.email && (
                <label className="block mt-4">
                  <span className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">E-mail</span>
                  <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container px-4 h-[52px] opacity-70">
                    <Icon name="mail" className="text-on-surface-variant text-[20px]" />
                    <span className="font-body-md text-body-md text-on-surface-variant truncate">{profile.email}</span>
                  </div>
                </label>
              )}

              {error && (
                <p className="flex items-center gap-2 rounded-xl bg-error-container/50 text-on-error-container px-4 py-3 font-body-sm text-body-sm mt-4">
                  <Icon name="error" fill className="text-[18px] shrink-0" /> {error}
                </p>
              )}
            </div>

            <div className="p-container-padding border-t border-outline-variant/60 pb-safe shrink-0">
              <Button fullWidth icon={saving ? 'progress_activity' : 'save'} onClick={save} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
