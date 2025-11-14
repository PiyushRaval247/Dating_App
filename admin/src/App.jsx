import React, { useEffect, useState } from 'react'
import Login from './pages/Login.jsx'
import ReportedUsers from './pages/ReportedUsers.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Payments from './pages/Payments.jsx'
import Subscriptions from './pages/Subscriptions.jsx'

export default function App() {
  const [token, setToken] = useState('')
  const [activePage, setActivePage] = useState('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const t = localStorage.getItem('admin_token') || ''
    setToken(t)
    const storedTheme = localStorage.getItem('admin_theme')
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme)
    } else {
      // Prefer system theme if available
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }, [])

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      // Update root class immediately so the UI reflects the change without waiting for useEffect
      if (typeof document !== 'undefined') {
        const root = document.documentElement
        if (next === 'dark') root.classList.add('dark')
        else root.classList.remove('dark')
      }
      try { localStorage.setItem('admin_theme', next) } catch (e) {}
      return next
    })
  }

  // Reflect theme to document root so charts and global dark variants can detect it
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (theme === 'dark') root.classList.add('dark')
      else root.classList.remove('dark')
    }
  }, [theme])

  const handleLogout = () => {
    try {
      localStorage.removeItem('admin_token')
    } catch (e) {}
    setToken('')
  }

  if (!token) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 text-gray-900 dark:text-gray-100">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Admin Panel</h1>
              <button onClick={toggleTheme} className="rounded-md p-2 text-xs border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" title="Toggle theme" aria-label="Toggle theme">
                {theme === 'dark' ? (
                  // Sun icon for switching to light
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-yellow-400">
                    <circle cx="12" cy="12" r="4" strokeWidth="2" />
                    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeWidth="2" />
                  </svg>
                ) : (
                  // Moon icon for switching to dark
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-indigo-500">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Sign in to manage the dating app.</p>
            <Login onLogin={(t) => setToken(t || '')} />
          </div>
        </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col md:flex-row text-gray-900 dark:text-gray-100">
      {/* Mobile Topbar */}
      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center justify-between w-full">
        <button
          className="rounded-md p-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setMobileNavOpen(v => !v)}
          aria-label="Toggle navigation"
        >
          <span className="sr-only">Open navigation</span>
          <div className="space-y-1">
            <div className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300" />
            <div className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300" />
            <div className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300" />
          </div>
        </button>
        <div className="font-semibold text-gray-900 dark:text-gray-100">Admin</div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-xs border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-yellow-400">
                <circle cx="12" cy="12" r="4" strokeWidth="2" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeWidth="2" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-indigo-500">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeWidth="2" />
              </svg>
            )}
          </button>
        <button
          onClick={handleLogout}
          className="text-sm rounded-md px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-sm hover:opacity-90"
          title="Logout"
        >Logout</button>
        </div>
      </header>

      {/* Overlay for mobile drawer */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 md:hidden ${mobileNavOpen ? '' : 'hidden'}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Sidebar / Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 z-50 transform transition-transform md:static md:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="text-lg font-semibold">Admin</div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="text-xs rounded-md p-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-yellow-400">
                  <circle cx="12" cy="12" r="4" strokeWidth="2" />
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeWidth="2" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-indigo-500">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeWidth="2" />
                </svg>
              )}
            </button>
          <button
            onClick={handleLogout}
            className="text-sm rounded-md px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-sm hover:opacity-90"
            title="Logout"
          >Logout</button>
          </div>
        </div>
        <div className="md:hidden mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Menu</div>
          <button
            className="rounded-md px-2 py-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setMobileNavOpen(false)}
          >Close</button>
        </div>
        <nav className="space-y-1">
          <button
            className={`flex items-center gap-2 w-full text-left rounded-md px-3 py-2 transition ${activePage === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-200 dark:ring-indigo-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            onClick={() => { setActivePage('dashboard'); setMobileNavOpen(false) }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-600"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/></svg>
            Dashboard
          </button>
          <button
            className={`flex items-center gap-2 w-full text-left rounded-md px-3 py-2 transition ${activePage === 'payments' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-200 dark:ring-indigo-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            onClick={() => { setActivePage('payments'); setMobileNavOpen(false) }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-600"><path d="M12 3l9 4-9 4-9-4 9-4zm0 7l9 4-9 4-9-4 9-4zm0 7l9 4-9 4-9-4 9-4z" fill="currentColor"/></svg>
            Payments
          </button>
          <button
            className={`flex items-center gap-2 w-full text-left rounded-md px-3 py-2 transition ${activePage === 'subscriptions' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-200 dark:ring-indigo-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            onClick={() => { setActivePage('subscriptions'); setMobileNavOpen(false) }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-600"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" fill="currentColor"/></svg>
            Subscriptions
          </button>
          <button
            className={`flex items-center gap-2 w-full text-left rounded-md px-3 py-2 transition ${activePage === 'reported' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium ring-1 ring-indigo-200 dark:ring-indigo-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
            onClick={() => { setActivePage('reported'); setMobileNavOpen(false) }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-600"><path d="M21 3H3v18l9-4 9 4V3z" fill="currentColor"/></svg>
            Reported Users
          </button>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 container mx-auto max-w-7xl">
        {activePage === 'dashboard' && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Overview of key metrics.</p>
            </div>
            <Dashboard />
          </>
        )}
        {activePage === 'payments' && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Payments</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Search, filter, and review payment records.</p>
            </div>
            <Payments />
          </>
        )}
        {activePage === 'subscriptions' && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Subscriptions</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Search, filter, and review subscriptions.</p>
            </div>
            <Subscriptions />
          </>
        )}
        {activePage === 'reported' && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Reported Users</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Users who have been reported by others.</p>
            </div>
            <ReportedUsers />
          </>
        )}
      </main>
    </div>
  )
}