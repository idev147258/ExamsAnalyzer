import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Brain, TrendingUp, CheckCircle, Target, BookOpen, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: Brain,
    description: 'Overview & exam setup',
  },
  {
    to: '/generator',
    label: 'Generator',
    icon: BookOpen,
    description: 'Flashcards · Cloze · Concept Maps',
  },
  {
    to: '/analyser',
    label: 'Analyser',
    icon: TrendingUp,
    description: 'Trends · Traps · Distractors',
  },
  {
    to: '/validator',
    label: 'Validator',
    icon: CheckCircle,
    description: 'ROTI · Source Evolution',
  },
  {
    to: '/eliminator',
    label: 'Eliminator',
    icon: Target,
    description: 'Heuristic Guessing Engine',
  },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-tight">ExamsAnalyzer</div>
              <div className="text-xs text-gray-500">AI Exam Strategist</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, description }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{label}</div>
                    <div className={clsx('text-xs truncate', isActive ? 'text-brand-200' : 'text-gray-600')}>
                      {description}
                    </div>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-brand-300 shrink-0" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-600 text-center">
            Powered by Claude AI
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
