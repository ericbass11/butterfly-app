import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from '@/lib/utils'

const SRC = `${import.meta.env.BASE_URL}media/intro.mp4`
const POSTER = `${import.meta.env.BASE_URL}media/intro-poster.jpg`

/**
 * Abertura do app: a animação do logo (casulo → borboleta → "Butterfly") toca
 * UMA vez em tela cheia e revela a tela seguinte. Pode ser pulada. Encerra
 * sozinha ao terminar, em erro de codec, ou por segurança após alguns segundos
 * (nunca trava a entrada). O vídeo já traz a marca — sem sobreposições.
 */
export function IntroSplash({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [leaving, setLeaving] = useState(false)
  const done = useRef(false)

  function finish() {
    if (done.current) return
    done.current = true
    setLeaving(true)
    setTimeout(onDone, 480)
  }

  useEffect(() => {
    ref.current?.play().catch(() => {})
    const t = setTimeout(finish, 9000) // rede de segurança
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div
      className={clsx(
        'fixed inset-0 z-[100] flex items-center justify-center bg-[#eceae7] transition-opacity duration-500',
        leaving ? 'opacity-0' : 'opacity-100',
      )}
    >
      <video
        ref={ref}
        className="w-full h-full object-contain"
        src={SRC}
        poster={POSTER}
        muted
        playsInline
        autoPlay
        preload="auto"
        onEnded={finish}
        onError={finish}
        aria-label="Butterfly"
      />
      <button
        onClick={finish}
        className="absolute bottom-9 rounded-full bg-black/10 px-6 py-2.5 font-label-md text-label-md text-[#2b2b2b] backdrop-blur active:scale-95 transition-transform"
      >
        Pular
      </button>
    </div>,
    document.body,
  )
}
