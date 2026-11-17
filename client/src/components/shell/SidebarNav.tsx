import { NavLink } from 'react-router'
import { LayoutDashboard, Plug } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useThreadStats } from '../../hooks/useThreads'
import { NAV_GROUPS, SEGMENTS } from '../../lib/segments'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
    isActive
      ? 'bg-primary/10 font-medium text-primary'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
  )

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { data: stats } = useThreadStats()
  const counts = stats?.counts

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <NavLink to="/app" end onClick={onNavigate} className={linkClass}>
        <LayoutDashboard className="h-4 w-4" />
        Overview
      </NavLink>

      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          {group.keys.map((key) => {
            const { label, icon: Icon } = SEGMENTS[key]
            const count = counts?.[key]
            return (
              <NavLink
                key={key}
                to={`/app/inbox/${key}`}
                onClick={onNavigate}
                className={linkClass}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{label}</span>
                {count ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs tabular-nums',
                      key === 'review'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </NavLink>
            )
          })}
        </div>
      ))}

      <div className="mt-auto border-t pt-4">
        <NavLink to="/app/accounts" onClick={onNavigate} className={linkClass}>
          <Plug className="h-4 w-4" />
          Connected accounts
        </NavLink>
      </div>
    </nav>
  )
}