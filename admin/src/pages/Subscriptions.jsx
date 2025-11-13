import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_URL } from '../config.js'

export default function Subscriptions() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [summary, setSummary] = useState({ total: 0, active: 0 })

  const fetchSubs = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('admin_token') || ''
      const params = {}
      if (userId) params.userId = userId
      if (status) params.status = status
      if (start) params.start = start
      if (end) params.end = end
      const res = await axios.get(`${BASE_URL}/admin/subscriptions`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data || { items: [], total: 0, active: 0 }
      setItems(Array.isArray(data.items) ? data.items : [])
      setSummary({ total: data.total || 0, active: data.active || 0 })
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load subscriptions'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSubs() }, [])

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="user-123"
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
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="datetime-local"
              value={start}
              onChange={e => setStart(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="datetime-local"
              value={end}
              onChange={e => setEnd(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchSubs}
              className="w-full rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700"
            >Search</button>
          </div>
        </div>
      </div>

      {loading && <div className="text-gray-600">Loading subscriptions…</div>}
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Total Subscriptions</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{summary.total}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Active Subscriptions</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{summary.active}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map(s => (
                  <tr key={s.subscriptionId}>
                    <td className="px-4 py-2 text-sm text-gray-900">{s.firstName || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{s.email || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{s.planName || s.plan}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{s.price}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>{s.status || '—'}</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">{s.startDate ? new Date(s.startDate).toLocaleString() : '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{s.endDate ? new Date(s.endDate).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan="7">No subscriptions found</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}