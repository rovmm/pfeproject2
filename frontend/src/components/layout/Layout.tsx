import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function Layout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] transition-all duration-300">
      <Sidebar />
      <Topbar />
      <main
        className="
          transition-all duration-300
          pt-[60px] pl-0 lg:pl-60
          min-h-screen
        "
      >
        <div className="p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
