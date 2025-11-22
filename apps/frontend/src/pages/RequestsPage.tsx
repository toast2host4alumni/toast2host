import { useEffect, useState } from 'react'
import { approveConnection, getMyPendingConnections, rejectConnection, getMyConnections, type PendingConnection, type ConnectedUser } from '@/lib/graphql/operations'
import AuthGuard from '@/components/AuthGuard'
import { toast } from 'sonner'

function RequestsContent() {
  const [activeTab, setActiveTab] = useState<'pending' | 'connected'>('pending')
  const [pendingItems, setPendingItems] = useState<PendingConnection[]>([])
  const [connectedItems, setConnectedItems] = useState<ConnectedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject'; item: PendingConnection } | null>(null)
  const [celebratingIds, setCelebratingIds] = useState<Set<string>>(new Set())

  async function loadPending() {
    try {
      const list = await getMyPendingConnections()
      setPendingItems(list)
    } catch {
      setError('Failed to load pending requests')
    }
  }

  async function loadConnected() {
    try {
      const list = await getMyConnections()
      setConnectedItems(list)
    } catch {
      setError('Failed to load connections')
    }
  }

  async function load() {
    setLoading(true)
    setError(null)
    await Promise.all([loadPending(), loadConnected()])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleApproveDirectly = async (item: PendingConnection) => {
    setProcessingId(item.id)
    try {
      await approveConnection(item.id)
      // Show celebration animation
      setCelebratingIds(prev => new Set(prev).add(item.id))
      toast.success(`Connected with ${item.requester.name}`)

      // Remove from pending immediately
      setPendingItems(prev => prev.filter(p => p.id !== item.id))

      // Add to connected list
      const newConnection: ConnectedUser = {
        userId: item.requester.userId,
        name: item.requester.name,
        university: item.requester.university,
        location: item.requester.location,
        profilePhotoUrl: item.requester.profilePhotoUrl,
        batchYear: item.requester.batchYear,
        linkedinUrl: item.requester.linkedinUrl,
        email: item.requester.email || '',
        connectedAt: new Date().toISOString(),
      }
      setConnectedItems(prev => [newConnection, ...prev])

      // Clear celebration after 2 seconds
      setTimeout(() => {
        setCelebratingIds(prev => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      }, 2000)
    } catch {
      toast.error('Failed to approve connection')
    } finally {
      setProcessingId(null)
    }
  }

  const handleApprove = async () => {
    if (!confirmAction || confirmAction.type !== 'approve') return
    const item = confirmAction.item
    setConfirmAction(null)
    await handleApproveDirectly(item)
  }

  const handleReject = async () => {
    if (!confirmAction || confirmAction.type !== 'reject') return
    const item = confirmAction.item
    setProcessingId(item.id)
    setConfirmAction(null)
    try {
      await rejectConnection(item.id)
      toast.success(`Rejected request from ${item.requester.name}`)
      load()
    } catch {
      toast.error('Failed to reject connection')
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    return date.toLocaleDateString()
  }

  return (
    <main className="p-3 max-w-7xl mx-auto space-y-4 fade-in">
      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmAction.type === 'approve' ? 'Approve Connection' : 'Reject Request'}
            </h3>
            <p className="text-gray-600 mb-4">
              {confirmAction.type === 'approve'
                ? `Accept connection request from ${confirmAction.item.requester.name}? Their email will be shared with you.`
                : `Reject connection request from ${confirmAction.item.requester.name}?`}
            </p>
            {confirmAction.item.requester.linkedinUrl && (
              <div className="mb-3 p-2.5 bg-blue-50 rounded-lg">
                <a
                  href={confirmAction.item.requester.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  Review LinkedIn Profile
                </a>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.type === 'approve' ? handleApprove : handleReject}
                className={`px-6 py-2 rounded-lg font-bold ${
                  confirmAction.type === 'approve'
                    ? 'bg-primary text-black hover:bg-primary-dark'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {confirmAction.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Connections</h1>
          <p className="text-gray-600 mt-2">Manage your connection requests and contacts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-semibold transition-colors relative ${
            activeTab === 'pending'
              ? 'text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Requests
          {pendingItems.length > 0 && (
            <span className="ml-2 bg-primary text-black text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingItems.length}
            </span>
          )}
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('connected')}
          className={`px-4 py-2 font-semibold transition-colors relative ${
            activeTab === 'connected'
              ? 'text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Connections
          {connectedItems.length > 0 && (
            <span className="ml-2 bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {connectedItems.length}
            </span>
          )}
          {activeTab === 'connected' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="animate-spin h-10 w-10 text-primary mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        ) : error ? (
          <div className="alert-error">
            <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        ) : activeTab === 'pending' ? (
          pendingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-1">No pending requests</p>
              <p className="text-sm">When someone wants to connect, requests will appear here</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card View */}
              <div className="block md:hidden space-y-4">
                {pendingItems.map((it) => (
                  <div key={it.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                        {it.requester.profilePhotoUrl ? (
                          <img src={it.requester.profilePhotoUrl} alt={it.requester.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary">{it.requester.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{it.requester.name}</h3>
                      <span className="text-xs text-gray-500 mb-2">{formatDate(it.createdAt)}</span>
                      {it.requester.university && (
                        <p className="text-sm text-gray-600 mb-1">
                          {it.requester.university}
                          {it.requester.batchYear && ` - ${it.requester.batchYear}`}
                        </p>
                      )}
                      {it.requester.location && (
                        <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {it.requester.location}
                        </p>
                      )}
                      {it.requester.linkedinUrl && (
                        <a href={it.requester.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          View LinkedIn
                        </a>
                      )}
                      <div className="flex gap-3 w-full mt-2">
                        {celebratingIds.has(it.id) ? (
                          <div className="flex-1 relative">
                            <span className="relative flex-1 bg-green-500 text-white font-bold py-2.5 rounded-lg shadow-lg text-sm flex items-center justify-center scale-110">
                              <svg className="w-4 h-4 mr-1.5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Connected!
                            </span>
                          </div>
                        ) : (
                          <button
                            className="flex-1 bg-primary text-black font-bold py-2.5 rounded-lg shadow-md hover:shadow-lg hover:bg-primary-dark transition-all text-sm disabled:opacity-50"
                            onClick={() => handleApproveDirectly(it)}
                            disabled={processingId === it.id}
                          >
                            {processingId === it.id ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                        <button
                          className="flex-1 bg-white text-gray-700 font-semibold py-2.5 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:text-red-600 transition-all text-sm disabled:opacity-50"
                          onClick={() => setConfirmAction({ type: 'reject', item: it })}
                          disabled={processingId === it.id || celebratingIds.has(it.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: List View */}
              <div className="hidden md:block space-y-3">
                {pendingItems.map((it) => (
                  <div key={it.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        {it.requester.profilePhotoUrl ? (
                          <img src={it.requester.profilePhotoUrl} alt={it.requester.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <span className="text-xl font-bold text-primary">{it.requester.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-lg truncate">{it.requester.name}</h3>
                          <span className="text-xs text-gray-500">{formatDate(it.createdAt)}</span>
                        </div>
                        {it.requester.university && (
                          <p className="text-sm text-gray-600 mb-1">
                            {it.requester.university}
                            {it.requester.batchYear && ` - Class of ${it.requester.batchYear}`}
                          </p>
                        )}
                        {it.requester.location && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {it.requester.location}
                          </p>
                        )}
                        {it.requester.linkedinUrl && (
                          <a href={it.requester.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                            View LinkedIn
                          </a>
                        )}
                      </div>
                      <div className="flex gap-3 flex-shrink-0">
                        {celebratingIds.has(it.id) ? (
                          <div className="relative">
                            <span className="relative bg-green-500 text-white font-bold px-6 py-2.5 rounded-lg shadow-lg text-sm inline-flex items-center scale-110">
                              <svg className="w-4 h-4 mr-1.5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Connected!
                            </span>
                          </div>
                        ) : (
                          <button
                            className="bg-primary text-black font-bold px-5 py-2 rounded-lg shadow-md hover:shadow-lg hover:bg-primary-dark transition-all text-sm disabled:opacity-50"
                            onClick={() => handleApproveDirectly(it)}
                            disabled={processingId === it.id}
                          >
                            {processingId === it.id ? (
                              <svg className="animate-spin h-4 w-4 mx-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-1.5 inline" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Approve
                              </>
                            )}
                          </button>
                        )}
                        <button
                          className="bg-white text-gray-700 font-semibold px-5 py-2 rounded-lg border-2 border-gray-200 hover:border-red-300 hover:text-red-600 transition-all text-sm disabled:opacity-50"
                          onClick={() => setConfirmAction({ type: 'reject', item: it })}
                          disabled={processingId === it.id || celebratingIds.has(it.id)}
                        >
                          <svg className="w-4 h-4 mr-1.5 inline" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        ) : (
          // Connected Tab
          connectedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-1">No connections yet</p>
              <p className="text-sm">Start connecting with alumni from the search page</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card View */}
              <div className="block md:hidden space-y-4">
                {connectedItems.map((user) => (
                  <div key={user.userId} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                        {user.profilePhotoUrl ? (
                          <img src={user.profilePhotoUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                            <span className="text-2xl font-bold text-green-600">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{user.name}</h3>
                      <span className="text-xs text-gray-500 mb-2">Connected {formatDate(user.connectedAt)}</span>
                      <a href={`mailto:${user.email}`} className="text-sm text-primary hover:underline mb-2">{user.email}</a>
                      {user.university && (
                        <p className="text-sm text-gray-600 mb-1">
                          {user.university}
                          {user.batchYear && ` - ${user.batchYear}`}
                        </p>
                      )}
                      {user.location && (
                        <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {user.location}
                        </p>
                      )}
                      {user.linkedinUrl && (
                        <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          View LinkedIn
                        </a>
                      )}
                      <span className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-green-50 text-green-700 text-sm font-medium mt-2">
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Connected
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: List View */}
              <div className="hidden md:block space-y-3">
                {connectedItems.map((user) => (
                  <div key={user.userId} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        {user.profilePhotoUrl ? (
                          <img src={user.profilePhotoUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                            <span className="text-xl font-bold text-green-600">{user.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-lg truncate">{user.name}</h3>
                          <span className="text-xs text-gray-500">Connected {formatDate(user.connectedAt)}</span>
                        </div>
                        <a href={`mailto:${user.email}`} className="text-sm text-primary hover:underline mb-1 block">{user.email}</a>
                        {user.university && (
                          <p className="text-sm text-gray-600 mb-1">
                            {user.university}
                            {user.batchYear && ` - Class of ${user.batchYear}`}
                          </p>
                        )}
                        {user.location && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {user.location}
                          </p>
                        )}
                        {user.linkedinUrl && (
                          <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                            View LinkedIn
                          </a>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Connected
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </div>
    </main>
  )
}

export default function RequestsPage() {
  return (
    <AuthGuard>
      <RequestsContent />
    </AuthGuard>
  )
}
