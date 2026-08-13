import React, { useState } from 'react'
import { updateMyProfile } from '@/lib/graphql/operations'
import { useInvalidateCurrentUser } from '@/hooks/useCurrentUser'
import { toast } from 'sonner'

interface LinkedInRequiredModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    targetUserName: string
}

export default function LinkedInRequiredModal({
    isOpen,
    onClose,
    onSuccess,
    targetUserName,
}: LinkedInRequiredModalProps) {
    const [linkedinUrl, setLinkedinUrl] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const invalidateUser = useInvalidateCurrentUser()

    if (!isOpen) return null

    const validateLinkedInUrl = (url: string): boolean => {
        if (!url.trim()) {
            setError('LinkedIn URL is required')
            return false
        }
        if (!url.toLowerCase().includes('linkedin.com')) {
            setError('Please enter a valid LinkedIn URL (must contain linkedin.com)')
            return false
        }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!validateLinkedInUrl(linkedinUrl)) {
            return
        }

        setIsSubmitting(true)
        try {
            await updateMyProfile({ linkedin_url: linkedinUrl })
            await invalidateUser()
            toast.success('LinkedIn profile added successfully')
            onSuccess()
        } catch (err) {
            console.error('Failed to update LinkedIn URL:', err)
            setError('Failed to save LinkedIn URL. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden fade-in">
                {/* Header with shield icon */}
                <div className="bg-black p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-md mb-4">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-primary">LinkedIn Verification Required</h2>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 text-center leading-relaxed">
                        For your safety and trust, LinkedIn verification is required before requesting to stay with alumni.
                        This helps confirm real identity and alumni background.
                    </p>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-blue-800">
                                You're about to book with <span className="font-semibold">{targetUserName}</span>.
                                Adding your LinkedIn helps build mutual trust in our alumni community.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Your LinkedIn Profile URL
                            </label>
                            <input
                                type="url"
                                value={linkedinUrl}
                                onChange={(e) => {
                                    setLinkedinUrl(e.target.value)
                                    setError(null)
                                }}
                                placeholder="https://linkedin.com/in/yourname"
                                className="w-full border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-primary py-3 px-4 text-base"
                                disabled={isSubmitting}
                                autoFocus
                            />
                            {error && (
                                <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-28 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 btn-primary py-3 px-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                        </svg>
                                        Add LinkedIn & Book
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
