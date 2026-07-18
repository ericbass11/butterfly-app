import { NavLink } from 'react-router-dom'
import { clsx } from '@/lib/utils'
import { Icon } from './Icon'

const items = [
  { to: '/app', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/app/educacao', label: 'Educação', icon: 'school', end: false },
  { to: '/app/chat', label: 'Chat IA', icon: 'smart_toy', end: false },
  { to: '/app/perfil', label: 'Perfil', icon: 'person', end: false },
]

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe
                 bg-surface/80 backdrop-blur-xl shadow-ambient-lg rounded-t-2xl border-t border-white/40
                 mx-auto max-w-[520px] left-1/2 -translate-x-1/2"
    >
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className="outline-none">
          {({ isActive }) => (
            <span
              className={clsx(
                'flex flex-col items-center justify-center rounded-full px-4 py-1 transition-all active:scale-90',
                isActive
                  ? 'text-on-primary bg-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high',
              )}
            >
              <Icon name={item.icon} fill={isActive} className="text-[24px]" />
              <span className="font-label-md text-[10px] mt-1 leading-none">{item.label}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
