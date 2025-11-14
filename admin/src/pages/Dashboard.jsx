import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_URL } from '../config.js'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentsSeries, setPaymentsSeries] = useState([])
  const [subscriptionsSeries, setSubscriptionsSeries] = useState([])
  const [paymentsItems, setPaymentsItems] = useState([])
  const [subscriptionsItems, setSubscriptionsItems] = useState([])
  const [days, setDays] = useState(14)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('admin_token') || ''
        const res = await axios.get(`${BASE_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = res.data || {}
        setStats(data)
        // Prefer server-provided series, else compute from lists
        if (Array.isArray(data.paymentsSeries) && data.paymentsSeries.length) {
          setPaymentsSeries(data.paymentsSeries)
        }
        if (Array.isArray(data.subscriptionsSeries) && data.subscriptionsSeries.length) {
          setSubscriptionsSeries(data.subscriptionsSeries)
        }
        if (!(Array.isArray(data.paymentsSeries) && data.paymentsSeries.length)) {
          // Fallback: build payments series from list
          const pays = await axios.get(`${BASE_URL}/admin/payments`, { headers: { Authorization: `Bearer ${token}` } })
          const items = Array.isArray(pays.data?.items) ? pays.data.items : []
          setPaymentsItems(items)
          setPaymentsSeries(buildDailySeries(items, (i) => i.createdAt, (i) => Number(i.rosesPurchased || 0), days))
        }
        if (!(Array.isArray(data.subscriptionsSeries) && data.subscriptionsSeries.length)) {
          const subs = await axios.get(`${BASE_URL}/admin/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
          const items = Array.isArray(subs.data?.items) ? subs.data.items : []
          setSubscriptionsItems(items)
          setSubscriptionsSeries(buildDailySeries(items, (i) => i.startDate, () => 0, days))
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || 'Failed to load stats'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Recompute series when range changes based on cached items
  useEffect(() => {
    if (paymentsItems.length) {
      setPaymentsSeries(buildDailySeries(paymentsItems, (i) => i.createdAt, (i) => Number(i.rosesPurchased || 0), days))
    }
    if (subscriptionsItems.length) {
      setSubscriptionsSeries(buildDailySeries(subscriptionsItems, (i) => i.startDate, () => 0, days))
    }
  }, [days])

  if (loading) {
    return <div className="text-gray-600 dark:text-gray-300">Loading dashboard…</div>
  }
  if (error) {
    return <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">{error}</div>
  }
  if (!stats) return null

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: 'users', accent: 'indigo' },
    { label: 'Active Users', value: stats.activeUsers, icon: 'user-active', accent: 'emerald' },
    { label: 'Blocked Users', value: stats.blockedUsers, icon: 'user-block', accent: 'rose' },
    { label: 'Reported Users', value: stats.reportedUsersCount, icon: 'flag', accent: 'amber' },
    { label: 'Total Reports', value: stats.totalReports, icon: 'document', accent: 'cyan' },
    { label: 'Total Subscriptions', value: stats.totalSubscriptions, icon: 'subs', accent: 'violet' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: 'subs-active', accent: 'indigo' },
    { label: 'Total Payments', value: stats.totalPayments, icon: 'payment', accent: 'emerald' },
    { label: 'Roses Purchased', value: stats.totalRosesPurchased, icon: 'rose', accent: 'fuchsia' },
  ]

  return (
    <div className="space-y-6">
      {/* 14-day Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-300">Payments (last 14 days)</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Count vs Roses Purchased</div>
            </div>
            <RangeSelect days={days} setDays={setDays} />
          </div>
          <div className="mt-3">
            <AreaLineChart
              series={paymentsSeries}
              lines={[{ key: 'count', color: '#22C55E', label: 'Payments' }, { key: 'value', color: '#F59E0B', label: 'Roses' }]}
              height={160}
            />
            <div className="mt-2 flex items-center gap-4 text-xs">
              <Legend color="#22C55E" label="Payments" />
              <Legend color="#F59E0B" label="Roses" />
            </div>
            <TotalsFooter series={paymentsSeries} keys={[{ key: 'count', label: 'Payments' }, { key: 'value', label: 'Roses Purchased' }]} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-300">Subscriptions (last 14 days)</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">New starts per day</div>
            </div>
            <RangeSelect days={days} setDays={setDays} />
          </div>
          <div className="mt-3">
            <AreaLineChart
              series={subscriptionsSeries}
              lines={[{ key: 'count', color: '#6366F1', label: 'New Starts' }]}
              height={160}
            />
            <div className="mt-2 flex items-center gap-4 text-xs">
              <Legend color="#6366F1" label="New Starts" />
            </div>
            <TotalsFooter series={subscriptionsSeries} keys={[{ key: 'count', label: 'New Starts' }]} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} accent={c.accent} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-300">Subscriptions</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active vs Total</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center">
            <RingChart total={stats.totalSubscriptions} value={stats.activeSubscriptions} colors={["#6366F1", "#E5E7EB"]} />
          </div>
          <div className="mt-2 text-center text-sm text-gray-700 dark:text-gray-300">
            {stats.activeSubscriptions} active of {stats.totalSubscriptions} total
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-300">Payments</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total count vs roses purchased</div>
            </div>
          </div>
          <div className="mt-4">
            <BarChart bars={[
              { label: 'Payments', value: Number(stats.totalPayments || 0), color: '#22C55E' },
              { label: 'Roses', value: Number(stats.totalRosesPurchased || 0), color: '#F59E0B' },
            ]} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2">Payments: <span className="font-semibold">{stats.totalPayments}</span></div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2">Roses Purchased: <span className="font-semibold">{stats.totalRosesPurchased}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Top Reported Users</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">Most reports (top 5)</p>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reports</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {(stats.topReportedUsers || []).map(u => (
              <tr key={u.userId}>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{u.firstName || '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{u.email || '—'}</td>
                <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{u.reportCount ?? 0}</td>
                <td className="px-4 py-2 text-sm">
                  {u.accountBlocked ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">Blocked</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">Active</span>
                  )}
                </td>
              </tr>
            ))}
            {(stats.topReportedUsers || []).length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400" colSpan="4">No reported users</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon = 'users', accent = 'indigo' }) {
  const accents = {
    indigo: { color: '#6366F1', soft: 'rgba(99,102,241,0.10)' },
    emerald: { color: '#10B981', soft: 'rgba(16,185,129,0.10)' },
    rose: { color: '#F43F5E', soft: 'rgba(244,63,94,0.10)' },
    amber: { color: '#F59E0B', soft: 'rgba(245,158,11,0.10)' },
    cyan: { color: '#06B6D4', soft: 'rgba(6,182,212,0.10)' },
    violet: { color: '#8B5CF6', soft: 'rgba(139,92,246,0.10)' },
    fuchsia: { color: '#D946EF', soft: 'rgba(217,70,239,0.10)' },
  }
  const theme = accents[accent] || accents.indigo
  return (
    <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${theme.soft}, transparent 60%)` }} />
      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.soft }}>
          <Icon name={icon} color={theme.color} />
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
          <div className="mt-0.5 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
        </div>
      </div>
    </div>
  )
}

function Icon({ name = 'users', color = '#6366F1', size = 22 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'user-active':
      return (
        <svg {...common}>
          <circle cx="12" cy="7" r="4" />
          <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
          <path d="M18 6l2-2" />
          <path d="M18 10l2 2" />
        </svg>
      )
    case 'user-block':
      return (
        <svg {...common}>
          <circle cx="12" cy="7" r="4" />
          <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
          <path d="M15 5l4 4" />
          <path d="M19 5l-4 4" />
        </svg>
      )
    case 'flag':
      return (
        <svg {...common}>
          <path d="M4 4v16" />
          <path d="M4 4h10l-2 4 2 4H4" />
        </svg>
      )
    case 'document':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      )
    case 'subs':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M7 8h10" />
          <path d="M7 12h6" />
        </svg>
      )
    case 'subs-active':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M7 8h10" />
          <path d="M7 12h6" />
          <path d="M16 16l2 2 3-3" />
        </svg>
      )
    case 'payment':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <circle cx="8" cy="15" r="2" />
        </svg>
      )
    case 'rose':
      return (
        <svg {...common}>
          <path d="M12 2c2 0 4 1 4 3s-2 3-4 3-4-1-4-3 2-3 4-3z" />
          <path d="M12 8c0 4-3 5-3 8 0 3 3 5 3 5s3-2 3-5c0-3-3-4-3-8" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

function buildDailySeries(items = [], dateAccessor, valueAccessor, nDays = 14) {
  const days = []
  const now = Date.now()
  for (let i = nDays - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000)
    days.push({ date: d.toISOString().slice(0, 10), count: 0, value: 0 })
  }
  const index = Object.fromEntries(days.map((d, i) => [d.date, i]))
  items.forEach(it => {
    const ts = dateAccessor(it)
    if (!ts) return
    const iso = new Date(ts).toISOString().slice(0, 10)
    const idx = index[iso]
    if (idx === undefined) return
    days[idx].count += 1
    days[idx].value += Number(valueAccessor(it) || 0)
  })
  return days
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
    </div>
  )
}

function RangeSelect({ days, setDays }) {
  return (
    <select
      value={days}
      onChange={e => setDays(Number(e.target.value))}
      className="rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label="Chart range"
    >
      <option value={7}>7d</option>
      <option value={14}>14d</option>
      <option value={30}>30d</option>
    </select>
  )
}

function TotalsFooter({ series = [], keys = [] }) {
  const totals = keys.map(k => ({ label: k.label, value: series.reduce((s, d) => s + Number(d[k.key] || 0), 0) }))
  if (!series.length || totals.every(t => t.value === 0)) {
    return (
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">No activity in selected period.</div>
    )
  }
  return (
    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
      {totals.map(t => (
        <div key={t.label} className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 flex items-center justify-between">
          <span>{t.label}:</span>
          <span className="font-semibold">{t.value}</span>
        </div>
      ))}
    </div>
  )
}

function AreaLineChart({ series = [], lines = [], height = 160 }) {
  const width = 560 // virtual width; SVG is responsive via viewBox
  const padding = 24
  const n = Math.max(series.length, 1)
  const xStep = (width - padding * 2) / Math.max(n - 1, 1)
  const maxVal = (() => {
    const vals = []
    series.forEach(d => {
      lines.forEach(l => vals.push(Number(d[l.key] || 0)))
    })
    const m = Math.max(...vals, 1)
    return m <= 0 ? 1 : m
  })()
  const yScale = v => (height - padding) - (Number(v || 0) / maxVal) * (height - padding * 2)
  const xScale = i => padding + i * xStep
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  const makePath = (key) => {
    if (!series.length) return ''
    return series.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d[key] || 0)}`).join(' ')
  }

  const gridLines = 4
  const gridYs = Array.from({ length: gridLines + 1 }, (_, i) => padding + i * ((height - padding * 2) / gridLines))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[160px]">
      {/* background */}
      <rect x="0" y="0" width={width} height={height} fill="transparent" />
      {/* grid */}
      {gridYs.map((y, i) => (
        <line key={i} x1={padding} x2={width - padding} y1={y} y2={y} stroke={isDark ? '#374151' : '#E5E7EB'} strokeWidth={1} />
      ))}
      {/* area fill (first line only) */}
      {lines[0] && series.length > 0 && (
        <path
          d={`${makePath(lines[0].key)} L ${xScale(n - 1)} ${height - padding} L ${xScale(0)} ${height - padding} Z`}
          fill={`${lines[0].color}20`}
        />
      )}
      {/* lines */}
      {lines.map((l, idx) => (
        <path key={l.key} d={makePath(l.key)} stroke={l.color} strokeWidth={2} fill="none" />
      ))}
      {/* x-axis labels (sparse) */}
      {series.map((d, i) => (
        i % 3 === 0 ? (
          <text key={i} x={xScale(i)} y={height - 6} textAnchor="middle" fontSize="10" fill={isDark ? '#9CA3AF' : '#6B7280'}>
            {String(d.date).slice(5)}
          </text>
        ) : null
      ))}
    </svg>
  )
}

function RingChart({ total, value, size = 160, strokeWidth = 20, colors = ["#6366F1", "#E5E7EB"] }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? (value / total) * circumference : 0
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
          <stop offset="100%" stopColor="#D946EF" stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={radius} stroke={isDark ? '#374151' : colors[1]} strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#ringGrad)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${progress} ${circumference}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      {/* Center labels */}
      <text x={size/2} y={size/2 - 6} textAnchor="middle" fontSize="16" fontWeight="700" fill={isDark ? '#F9FAFB' : '#111827'}>
        {value}
      </text>
      <text x={size/2} y={size/2 + 12} textAnchor="middle" fontSize="10" fill={isDark ? '#9CA3AF' : '#6B7280'}>
        of {total} active
      </text>
    </svg>
  )
}

function BarChart({ bars = [] }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="space-y-3">
      {bars.map(b => (
        <div key={b.label} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-600 dark:text-gray-300">{b.label}</div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-md h-3">
            <div
              className="h-3 rounded-md"
              style={{ width: `${(b.value / max) * 100}%`, backgroundColor: b.color }}
              title={`${b.value}`}
            />
          </div>
          <div className="w-16 text-sm text-gray-900 dark:text-gray-100 text-right">{b.value}</div>
        </div>
      ))}
    </div>
  )
}