import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/daily-log', label: 'Daily Log', icon: '📝' },
  { to: '/problems', label: 'Problems', icon: '⚠️' },
  { to: '/collocations', label: 'Collocations', icon: '📚' },
  { to: '/my-words', label: 'My Words', icon: '📖' },
  { to: '/synonyms', label: 'Synonyms', icon: '🔗' },
  { to: '/topics', label: 'Topics', icon: '🏷️' },
  { to: '/essays', label: 'Essays', icon: '✍️' },
  { to: '/writing-task1', label: 'Writing Task 1', icon: '📊' },
  { to: '/writing-mistakes', label: 'Writing Mistakes', icon: '❌' },
  { to: '/study', label: 'Study', icon: '⏰' },
  { to: '/band-score', label: 'Band Score', icon: '📊' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/export', label: 'Export', icon: '📤' },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">IELTS Prep Tracker</h1>
          <p className="text-xs text-gray-500 mt-1">Track your journey to success</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">Data stored locally in browser</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
