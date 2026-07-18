import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { clsx } from '@/lib/utils'

const SRC = `${import.meta.env.BASE_URL}media/metamorphosis.mp4`
const POSTER = `${import.meta.env.BASE_URL}media/metamorphosis-poster.jpg`

interface Props {
  className?: string
}

/**
 * Vídeo-herói da metamorfose (lagarta → casulo → borboleta).
 *
 * - `object-contain` sobre um fundo claro que combina com o vídeo, para mostrar
 *   a criatura inteira sem cortes.
 * - Autoplay mudo em loop (playsInline p/ iOS). Respeita `prefers-reduced-motion`:
 *   nesse caso mostra só o pôster, sem animação.
 * - Leve (~400 KB) e fora do precache do PWA — carrega da rede quando aparece.
 */
export function MetamorphosisHero({ className }: Props) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v || reduce) return
    // Alguns navegadores exigem play() explícito após o carregamento.
    const tryPlay = () => v.play().catch(() => {})
    tryPlay()
  }, [reduce])

  // Sem animação (preferência do usuário) ou vídeo sem suporte de codec →
  // mostra o pôster (a criatura final), nunca um card vazio.
  const showPoster = reduce || errored

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-[28px] shadow-ambient-lg ring-1 ring-primary-container/30',
        'bg-gradient-to-b from-[#f4f2ef] to-[#eceae7]',
        className,
      )}
    >
      {showPoster ? (
        <img
          src={POSTER}
          alt="Metamorfose: da lagarta à borboleta"
          className="w-full h-full object-contain"
        />
      ) : (
        <video
          ref={ref}
          className={clsx('w-full h-full object-contain transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0')}
          src={SRC}
          poster={POSTER}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-label="Metamorfose: da lagarta à borboleta"
          onCanPlay={() => setReady(true)}
          onError={() => setErrored(true)}
        />
      )}
      {/* leve brilho superior para dar profundidade */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,255,255,0.35),transparent_60%)]" />
    </div>
  )
}
