import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_URL } from '../config.js'

export default function Payments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [summary, setSummary] = useState({ total: 0, totalRoses: 0 })

  const fetchPayments = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('admin_token') || ''
      const params = {}
      if (userId) params.userId = userId
      if (start) params.start = start
      if (end) params.end = end
      const res = await axios.get(`${BASE_URL}/admin/payments`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data || { items: [], total: 0, totalRoses: 0 }
      setItems(Array.isArray(data.items) ? data.items : [])
      setSummary({ total: data.total || 0, totalRoses: data.totalRoses || 0 })
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load payments'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayments() }, [])

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
              onClick={fetchPayments}
              className="w-full rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700"
            >Search</button>
          </div>
        </div>
      </div>

      {loading && <div className="text-gray-600">Loading payments…</div>}
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Total Payments</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{summary.total}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-500">Total Roses Purchased</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{summary.totalRoses}</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roses</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map(p => (
                  <tr key={p.paymentId}>
                    <td className="px-4 py-2 text-sm text-gray-900">{p.paymentId}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{p.userId}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{p.rosesPurchased}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{p.status || '—'}</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">{p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan="5">No payments found</td>
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