import React, { useEffect, useState } from 'react'
import { getTodayDateString } from '@/lib/date'

interface TripDetailsRequiredModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (details: { travelDateFrom: string; travelDateTo: string; guests: number }) => void
    targetUserName: string
    initialTravelDateFrom?: string
    initialTravelDateTo?: string
    initialGuests?: number
}

export default function TripDetailsRequiredModal({
    isOpen,
    onClose,
    onSubmit,
    targetUserName,
    initialTravelDateFrom,
    initialTravelDateTo,
    initialGuests,
}: TripDetailsRequiredModalProps) {
    const [travelDateFrom, setTravelDateFrom] = useState('')
    const [travelDateTo, setTravelDateTo] = useState('')
    const [guests, setGuests] = useState<number | undefined>(undefined)
    const [error, setError] = useState<string | null>(null)
    const today = getTodayDateString()

    // Pre-fill from whatever the guest already entered in the search bar,
    // and reset each time the modal opens for a new host.
    useEffect(() => {
        if (isOpen) {
            setTravelDateFrom(initialTravelDateFrom || '')
            setTravelDateTo(initialTravelDateTo || '')
            setGuests(initialGuests)
            setError(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialTravelDateFrom, initialTravelDateTo, initialGuests])

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!travelDateFrom || !travelDateTo) {
            setError('Please select check-in and check-out dates')
            return
        }
        if (travelDateFrom < today) {
            setError('Check-in can\'t be in the past')
            return
        }
        if (travelDateTo < travelDateFrom) {
            setError('Check-out must be after check-in')
            return
        }
        if (!guests) {
            setError('Please select the number of guests')
            return
        }
        setError(null)
        onSubmit({ travelDateFrom, travelDateTo, guests })
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden fade-in">
                {/* Header */}
                <div className="bg-black p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md mb-4">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-primary">Trip Details Required</h2>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 text-center leading-relaxed">
                        Let <span className="font-semibold">{targetUserName}</span> know when you're planning to visit
                        and how many guests, so they can decide whether to approve your request.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Check-in</label>
                                <input
                                    type="date"
                                    className="w-full border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-primary py-2.5 px-3 text-base"
                                    value={travelDateFrom}
                                    min={today}
                                    onChange={(e) => { setTravelDateFrom(e.target.value); setError(null) }}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Check-out</label>
                                <input
                                    type="date"
                                    className="w-full border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-primary py-2.5 px-3 text-base"
                                    value={travelDateTo}
                                    min={travelDateFrom || today}
                                    onChange={(e) => { setTravelDateTo(e.target.value); setError(null) }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-2 border-gray-200 rounded-lg py-2.5 px-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Guests</p>
                                <p className="text-xs text-gray-500">How many are traveling?</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setGuests((g) => {
                                            const next = (g ?? 0) - 1
                                            return next <= 0 ? undefined : next
                                        })
                                        setError(null)
                                    }}
                                    disabled={!guests}
                                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400 transition-colors"
                                >
                                    −
                                </button>
                                <span className="w-6 text-center font-semibold text-gray-900">{guests ?? 0}</span>
                                <button
                                    type="button"
                                    onClick={() => { setGuests((g) => (g ?? 0) + 1); setError(null) }}
                                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-28 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 btn-primary py-3 px-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Continue to Book
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
