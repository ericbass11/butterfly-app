import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Mascot } from './Mascot'
import { Button } from './Button'
import { clsx } from '@/lib/utils'

export interface TourStep {
  /** valor do atributo data-tour do elemento a destacar (opcional = passo central) */
  target?: string
  title: string
  text: string
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

/**
 * Tutorial guiado com spotlight + a mascote Flutter. Destaca elementos reais da
 * interface (via data-tour) e explica o que fazer, passo a passo.
 */
export function GuidedTour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const step = steps[i]
  const last = i === steps.length - 1

  // Localiza e mede o alvo do passo atual (aguardando ele montar, se preciso).
  useLayoutEffect(() => {
    let raf = 0
    let tries = 0
    function measure() {
      if (!step.target) {
        setRect(null)
        return
      }
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      if (!el) {
        if (tries++ < 60) raf = requestAnimationFrame(measure)
        else setRect(null)
        return
      }
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      })
    }
    measure()
    return () => cancelAnimationFrame(raf)
  }, [i, step.target])

  // Reposiciona o holofote em scroll/resize.
  useEffect(() => {
    if (!step.target) return
    function upd() {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }
    }
    window.addEventListener('resize', upd)
    window.addEventListener('scroll', upd, true)
    return () => {
      window.removeEventListener('resize', upd)
      window.removeEventListener('scroll', upd, true)
    }
  }, [step.target])

  function next() {
    if (last) onDone()
    else setI((n) => n + 1)
  }
  function prev() {
    setI((n) => Math.max(0, n - 1))
  }

  // Card fica na metade OPOSTA ao alvo, para não cobri-lo.
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const targetCenterY = rect ? rect.top + rect.height / 2 : vh / 2
  const cardAtBottom = rect ? targetCenterY < vh * 0.5 : false
  const cardAtTop = rect ? targetCenterY >= vh * 0.5 : false
  const PAD = 8

  return createPortal(
    <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true">
      {/* Escurecimento + holofote */}
      {rect ? (
        <motion.div
          key={step.target}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute rounded-2xl ring-4 ring-primary/70"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(8, 25, 20, 0.72)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(8,25,20,0.78)]" />
      )}

      {/* Toque no fundo avança */}
      <button className="absolute inset-0 w-full h-full cursor-default" aria-label="Avançar" onClick={next} />

      {/* Cartão da mascote — posicionado por um wrapper flex (evita conflito de
          transform com a animação do framer-motion). */}
      <div
        className={clsx(
          'absolute inset-x-0 flex justify-center px-4 pointer-events-none',
          cardAtBottom && 'bottom-6',
          cardAtTop && 'top-8',
          !rect && 'inset-y-0 items-center',
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[440px] pointer-events-auto"
          >
            <div className="relative rounded-3xl bg-surface-container-lowest shadow-ambient-lg border border-white/50 pt-12 px-5 pb-5">
            {/* Mascote sobreposta */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <Mascot size={88} />
            </div>

            <button
              onClick={onDone}
              className="absolute top-3 right-4 font-label-md text-label-md text-on-surface-variant/70 active:scale-95"
            >
              Pular
            </button>

            <h3 className="text-center font-headline-md text-[20px] font-bold text-on-surface">{step.title}</h3>
            <p className="mt-1.5 text-center font-body-md text-body-md text-on-surface-variant">{step.text}</p>

            {/* Progresso */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {steps.map((_, idx) => (
                <span
                  key={idx}
                  className={clsx(
                    'h-1.5 rounded-full transition-all',
                    idx === i ? 'w-5 bg-primary' : 'w-1.5 bg-outline-variant',
                  )}
                />
              ))}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 mt-4">
              {i > 0 && (
                <Button variant="ghost" onClick={prev} className="flex-1">
                  Anterior
                </Button>
              )}
              <Button onClick={next} iconRight={last ? 'auto_awesome' : 'arrow_forward'} className="flex-1">
                {last ? 'Começar' : 'Próximo'}
              </Button>
            </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  )
}
