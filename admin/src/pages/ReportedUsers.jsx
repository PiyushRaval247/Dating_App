import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_URL } from '../config.js'

export default function ReportedUsers() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('') // '', 'active', 'blocked'

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await axios.get(`${BASE_URL}/reported-users`)
        setItems(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Failed to load reported users'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  if (loading) {
    return <div className="text-gray-600">Loading reported users…</div>
  }
  if (error) {
    return <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Search by name, email, or userId"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                // Just force re-render; filters are applied client-side below
                setItems([...items])
              }}
              className="w-full rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700"
            >Apply</button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
      {message && (
        <div className="px-4 py-2 bg-green-50 text-green-700 text-sm border-b border-green-200">{message}</div>
      )}
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Report</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items
            .filter(u => {
              const q = query.trim().toLowerCase()
              if (!q) return true
              return (
                String(u.firstName || '').toLowerCase().includes(q) ||
                String(u.email || '').toLowerCase().includes(q) ||
                String(u.userId || '').toLowerCase().includes(q)
              )
            })
            .filter(u => {
              if (!status) return true
              return status === 'blocked' ? !!u.accountBlocked : !u.accountBlocked
            })
            .sort((a,b) => (b.reportCount - a.reportCount))
            .map((u) => (
            <tr key={u.userId}>
              <td className="px-4 py-2 text-sm text-gray-900">{u.firstName || '—'}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{u.email || '—'}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{u.reportCount ?? 0}</td>
              <td className="px-4 py-2 text-sm text-gray-500">{u.lastReportAt ? new Date(u.lastReportAt).toLocaleString() : '—'}</td>
              <td className="px-4 py-2 text-sm">
                {u.accountBlocked ? (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Blocked</span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                )}
              </td>
              <td className="px-4 py-2 text-sm">
                {u.accountBlocked ? (
                  <button
                    className="rounded-md px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    disabled={busyId === u.userId}
                    onClick={async () => {
                      setBusyId(u.userId)
                      setMessage('')
                      try {
                        const token = localStorage.getItem('admin_token') || ''
                        await axios.delete(`${BASE_URL}/admin/block-user`, {
                          data: { userId: u.userId },
                          headers: { Authorization: `Bearer ${token}` }
                        })
                        setItems(prev => prev.map(x => x.userId === u.userId ? { ...x, accountBlocked: false } : x))
                        setMessage('User unblocked')
                      } catch (err) {
                        alert(err?.response?.data?.message || err.message || 'Failed to unblock user')
                      } finally {
                        setBusyId('')
                      }
                    }}
                  >Unblock</button>
                ) : (
                  <button
                    className="rounded-md px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    disabled={busyId === u.userId}
                    onClick={async () => {
                      setBusyId(u.userId)
                      setMessage('')
                      try {
                        const token = localStorage.getItem('admin_token') || ''
                        await axios.post(`${BASE_URL}/admin/block-user`, { userId: u.userId }, {
                          headers: { Authorization: `Bearer ${token}` }
                        })
                        setItems(prev => prev.map(x => x.userId === u.userId ? { ...x, accountBlocked: true } : x))
                        setMessage('User blocked')
                      } catch (err) {
                        alert(err?.response?.data?.message || err.message || 'Failed to block user')
                      } finally {
                        setBusyId('')
                      }
                    }}
                  >Block</button>
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan="6">No reported users found</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      </div>
    </div>
  )
}