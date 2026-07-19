import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { clsx } from '@/lib/utils'
import { Icon } from './Icon'

const items = [
  { to: '/app', label: 'Dashboard', icon: 'dashboard', end: true, tour: 'nav-dashboard' },
  { to: '/app/educacao', label: 'Educação', icon: 'school', end: false, tour: 'nav-educacao' },
  { to: '/app/chat', label: 'Chat IA', icon: 'smart_toy', end: false, tour: 'nav-chat' },
  { to: '/app/perfil', label: 'Perfil', icon: 'person', end: false, tour: 'nav-perfil' },
]

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe
                 bg-surface/80 backdrop-blur-xl shadow-ambient-lg rounded-t-2xl border-t border-white/40
                 mx-auto max-w-[520px] left-1/2 -translate-x-1/2"
    >
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} data-tour={item.tour} className="outline-none">
          {({ isActive }) => (
            <span
              className={clsx(
                'relative flex flex-col items-center justify-center rounded-full px-4 py-1 transition-colors active:scale-90',
                isActive ? 'text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="navPill"
                  className="absolute inset-0 rounded-full bg-primary-container"
                  transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                />
              )}
              <Icon name={item.icon} fill={isActive} className="relative z-10 text-[24px]" />
              <span className="relative z-10 font-label-md text-[10px] mt-1 leading-none">{item.label}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
