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

  useEffect(() => {
    const t = localStorage.getItem('admin_token') || ''
    setToken(t)
  }, [])

  const handleLogout = () => {
    try {
      localStorage.removeItem('admin_token')
    } catch (e) {}
    setToken('')
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Admin Panel</h1>
            <p className="text-sm text-gray-600 mb-6">Sign in to manage the dating app.</p>
            <Login onLogin={(t) => setToken(t || '')} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between w-full">
        <button
          className="rounded-md p-2 border border-gray-300 hover:bg-gray-100"
          onClick={() => setMobileNavOpen(v => !v)}
          aria-label="Toggle navigation"
        >
          <span className="sr-only">Open navigation</span>
          <div className="space-y-1">
            <div className="w-5 h-0.5 bg-gray-700" />
            <div className="w-5 h-0.5 bg-gray-700" />
            <div className="w-5 h-0.5 bg-gray-700" />
          </div>
        </button>
        <div className="font-semibold text-gray-900">Admin</div>
        <button
          onClick={handleLogout}
          className="text-sm rounded-md px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700"
          title="Logout"
        >Logout</button>
      </header>

      {/* Overlay for mobile drawer */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 md:hidden ${mobileNavOpen ? '' : 'hidden'}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Sidebar / Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 p-4 z-50 transform transition-transform md:static md:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="text-lg font-semibold">Admin</div>
          <button
            onClick={handleLogout}
            className="text-sm rounded-md px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700"
            title="Logout"
          >Logout</button>
        </div>
        <div className="md:hidden mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Menu</div>
          <button
            className="rounded-md px-2 py-1 border border-gray-300 hover:bg-gray-100"
            onClick={() => setMobileNavOpen(false)}
          >Close</button>
        </div>
        <nav className="space-y-2">
          <button
            className={`block w-full text-left rounded-md px-3 py-2 ${activePage === 'dashboard' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => { setActivePage('dashboard'); setMobileNavOpen(false) }}
          >Dashboard</button>
          <button
            className={`block w-full text-left rounded-md px-3 py-2 ${activePage === 'payments' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => { setActivePage('payments'); setMobileNavOpen(false) }}
          >Payments</button>
          <button
            className={`block w-full text-left rounded-md px-3 py-2 ${activePage === 'subscriptions' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => { setActivePage('subscriptions'); setMobileNavOpen(false) }}
          >Subscriptions</button>
          <button
            className={`block w-full text-left rounded-md px-3 py-2 ${activePage === 'reported' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
            onClick={() => { setActivePage('reported'); setMobileNavOpen(false) }}
          >Reported Users</button>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 container mx-auto max-w-7xl">
        {activePage === 'dashboard' && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-600">Overview of key metrics.</p>
            </div>
            <Dashboard />
          </>
        )}
        {activePage === 'payments' && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Payments</h2>
              <p className="text-sm text-gray-600">Search, filter, and review payment records.</p>
            </div>
            <Payments />
          </>
        )}
        {activePage === 'subscriptions' && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Subscriptions</h2>
              <p className="text-sm text-gray-600">Search, filter, and review subscriptions.</p>
            </div>
            <Subscriptions />
          </>
        )}
        {activePage === 'reported' && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Reported Users</h2>
              <p className="text-sm text-gray-600">Users who have been reported by others.</p>
            </div>
            <ReportedUsers />
          </>
        )}
      </main>
    </div>
  )
}