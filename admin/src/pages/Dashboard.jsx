import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_URL } from '../config.js'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('admin_token') || ''
        const res = await axios.get(`${BASE_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setStats(res.data)
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Failed to load stats'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return <div className="text-gray-600">Loading dashboard…</div>
  }
  if (error) {
    return <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>
  }
  if (!stats) return null

  const cards = [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Active Users', value: stats.activeUsers },
    { label: 'Blocked Users', value: stats.blockedUsers },
    { label: 'Reported Users', value: stats.reportedUsersCount },
    { label: 'Total Reports', value: stats.totalReports },
    { label: 'Total Subscriptions', value: stats.totalSubscriptions },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions },
    { label: 'Total Payments', value: stats.totalPayments },
    { label: 'Roses Purchased', value: stats.totalRosesPurchased },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Subscriptions</div>
              <div className="text-sm text-gray-600">Active vs Total</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center">
            <RingChart total={stats.totalSubscriptions} value={stats.activeSubscriptions} colors={["#6366F1", "#E5E7EB"]} />
          </div>
          <div className="mt-2 text-center text-sm text-gray-700">
            {stats.activeSubscriptions} active of {stats.totalSubscriptions} total
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Payments</div>
              <div className="text-sm text-gray-600">Total count vs roses purchased</div>
            </div>
          </div>
          <div className="mt-4">
            <BarChart bars={[
              { label: 'Payments', value: Number(stats.totalPayments || 0), color: '#22C55E' },
              { label: 'Roses', value: Number(stats.totalRosesPurchased || 0), color: '#F59E0B' },
            ]} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
            <div className="bg-gray-50 rounded-md p-2">Payments: <span className="font-semibold">{stats.totalPayments}</span></div>
            <div className="bg-gray-50 rounded-md p-2">Roses Purchased: <span className="font-semibold">{stats.totalRosesPurchased}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Top Reported Users</h3>
          <p className="text-xs text-gray-600">Most reports (top 5)</p>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(stats.topReportedUsers || []).map(u => (
              <tr key={u.userId}>
                <td className="px-4 py-2 text-sm text-gray-900">{u.firstName || '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{u.email || '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{u.reportCount ?? 0}</td>
                <td className="px-4 py-2 text-sm">
                  {u.accountBlocked ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Blocked</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                  )}
                </td>
              </tr>
            ))}
            {(stats.topReportedUsers || []).length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan="4">No reported users</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

function RingChart({ total, value, size = 160, strokeWidth = 20, colors = ["#6366F1", "#E5E7EB"] }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? (value / total) * circumference : 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors[1]}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors[0]}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${progress} ${circumference}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
    </svg>
  )
}

function BarChart({ bars = [] }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="space-y-3">
      {bars.map(b => (
        <div key={b.label} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-600">{b.label}</div>
          <div className="flex-1 bg-gray-100 rounded-md h-3">
            <div
              className="h-3 rounded-md"
              style={{ width: `${(b.value / max) * 100}%`, backgroundColor: b.color }}
              title={`${b.value}`}
            />
          </div>
          <div className="w-16 text-sm text-gray-900 text-right">{b.value}</div>
        </div>
      ))}
    </div>
  )
}