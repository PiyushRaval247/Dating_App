import React, {useState} from 'react'
import { notificationTemplates } from '../notificationsTemplates'
import { BASE_URL } from '../config.js'

export default function Notifications() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [dataJson, setDataJson] = useState('{}')
  const [userIdsText, setUserIdsText] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const send = async (e) => {
    e.preventDefault()
    setResult(null)
    let dataObj = {}
    try {
      dataObj = dataJson ? JSON.parse(dataJson) : {}
    } catch (err) {
      setResult({error: 'Invalid JSON in data field'})
      return
    }

    const userIds = userIdsText
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(Boolean)

    setSending(true)
    try {
      const token = localStorage.getItem('admin_token') || ''
      const resp = await fetch(`${BASE_URL}/admin/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, body, data: dataObj, userIds: userIds.length ? userIds : null }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json?.message || 'Request failed')
      setResult({ ok: true, json })
    } catch (err) {
      setResult({ ok: false, error: err?.message || String(err) })
    } finally {
      setSending(false)
    }
  }

  const applyTemplate = (templateId) => {
    const t = notificationTemplates.find(x => x.id === templateId)
    if (!t) return
    setTitle(t.title || '')
    setBody(t.body || '')
    setDataJson(JSON.stringify(t.data || {}, null, 2))
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Send Notification</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Compose a push notification to all users or specific user IDs (one per line or comma-separated).</p>
      <form onSubmit={send} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Template</label>
          <div className="mt-1 flex gap-2 items-center">
            <select onChange={e => applyTemplate(e.target.value)} className="rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2">
              <option value="">— Select a template —</option>
              {notificationTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <button type="button" onClick={() => { setTitle(''); setBody(''); setDataJson('{}') }} className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm">Clear</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Title</label>
          <input required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Body</label>
          <textarea required value={body} onChange={e => setBody(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Data (JSON)</label>
          <textarea value={dataJson} onChange={e => setDataJson(e.target.value)} className="mt-1 block w-full rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2" rows={4} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Target user IDs (optional)</label>
          <textarea value={userIdsText} onChange={e => setUserIdsText(e.target.value)} placeholder="leave empty to broadcast to all users" className="mt-1 block w-full rounded-md border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2" rows={3} />
        </div>
        <div className="flex items-center gap-2">
          <button disabled={sending} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:opacity-90">{sending ? 'Sending...' : 'Send'}</button>
          <button type="button" onClick={() => { setTitle(''); setBody(''); setDataJson('{}'); setUserIdsText(''); setResult(null) }} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600">Reset</button>
        </div>
      </form>
      <div className="mt-4">
        {result && result.ok && (
          <div className="p-3 rounded bg-green-50 border border-green-200 text-green-800">
            {result.json.topic === 'all' ? (
              <>
                <div>Broadcasted to topic "all"</div>
                {result.json.message && (
                  <div className="mt-1 text-xs text-gray-700">{result.json.message}</div>
                )}
              </>
            ) : (
              <>
                <div>Sent: {result.json.sent}{typeof result.json.failedCount === 'number' ? ` — failed: ${result.json.failedCount}` : ''}</div>
                {result.json.message && (
                  <div className="mt-1 text-xs text-gray-700">{result.json.message}</div>
                )}
                {typeof result.json.socketBroadcasted === 'number' && (
                  <div className="mt-1 text-xs text-gray-700">Online users notified: {result.json.socketBroadcasted}</div>
                )}
              </>
            )}
          </div>
        )}
        {result && !result.ok && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800">Error: {result.error}</div>
        )}
      </div>
    </div>
  )
}
