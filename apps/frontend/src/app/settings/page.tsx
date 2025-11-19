'use client'

import React, { useEffect, useState } from 'react'
import { createPrivacyRequest, getMyPrivacyRequests } from '@/lib/graphql/operations'
import AuthGuard from '@/components/AuthGuard'

type Req = { id: string; type: 'deletion' | 'export'; status: string; created_at: string; completed_at?: string | null }

function SettingsContent() {
  const [items, setItems] = useState<Req[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const list = await getMyPrivacyRequests()
    setItems(list)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const submit = async (type: 'deletion' | 'export') => {
    setNotice(null)
    await createPrivacyRequest(type)
    setNotice(`${type === 'export' ? 'Data export' : 'Account deletion'} request submitted`)
    load()
  }

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6 py-12 fade-in">
      <div>
        <h1 className="text-4xl font-black text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your privacy and data preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Privacy & Data</h2>
            <p className="text-gray-600 text-sm">Request your data or delete your account</p>
          </div>
        </div>

        <div className="divider"></div>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-lg border-2 border-gray-200 hover:border-primary transition-all px-6 py-4 rounded-xl font-semibold text-left flex items-center gap-4 group"
            onClick={() => submit('export')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Request Data Export</p>
              <p className="text-sm text-gray-600">Download all your data</p>
            </div>
          </button>

          <button
            className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-lg border-2 border-gray-200 hover:border-primary transition-all px-6 py-4 rounded-xl font-semibold text-left flex items-center gap-4 group"
            onClick={() => submit('deletion')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">Request Account Deletion</p>
              <p className="text-sm text-gray-600">Permanently delete your account</p>
            </div>
          </button>
        </div>

        {notice && (
          <div className="alert-success">
            <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {notice}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Your Privacy Requests
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="font-medium text-gray-700">No requests yet</p>
            <p className="text-sm">Your privacy requests will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-600">#{it.id}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${it.type === 'export' ? 'badge-primary' : 'badge-pending'}`}>
                        {it.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-700 font-medium">{it.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(it.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  )
}
