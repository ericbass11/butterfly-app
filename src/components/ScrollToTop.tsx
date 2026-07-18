import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reseta a rolagem para o topo sempre que a rota muda.
 * Sem isso, ao navegar entre telas o React Router preserva a posição
 * de scroll anterior (a página abre "no meio").
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Rola a janela e o elemento raiz para o topo (instantâneo, sem animação).
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname])

  return null
}
