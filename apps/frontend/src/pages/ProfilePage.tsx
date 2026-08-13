import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileInput } from '@/lib/validation/profile'
import UniversityCombobox from '@/components/UniversityCombobox'
import LocationCombobox, { type LocationValue } from '@/components/LocationCombobox'
import LinkedInInput from '@/components/LinkedInInput'
import { updateMyProfile, createPrivacyRequest, getMyPrivacyRequests } from '@/lib/graphql/operations'
import { useNavigate } from 'react-router-dom'
import AuthGuard from '@/components/AuthGuard'
import { useCurrentUser, useInvalidateCurrentUser } from '@/hooks/useCurrentUser'
import { getTodayDateString } from '@/lib/date'

type Req = { id: string; type: 'deletion' | 'export'; status: string; created_at: string; completed_at?: string | null }

function ProfileContent() {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>('profile')
  const navigate = useNavigate()
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const invalidateUser = useInvalidateCurrentUser()
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const today = getTodayDateString()

  // Privacy tab state
  const [privacyItems, setPrivacyItems] = useState<Req[]>([])
  const [privacyLoading, setPrivacyLoading] = useState(true)
  const [privacyNotice, setPrivacyNotice] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      university_name: '',
      location_text: '',
      linkedin_url: '',
      host_mode: false,
      phone_number: '',
      profile_visibility: 'everyone' as const,
    },
  })

  useEffect(() => {
    if (!userLoading && user?.profile && !initialDataLoaded) {
      const p = user.profile
      if (p.first_name) setValue('first_name', p.first_name)
      if (p.last_name) setValue('last_name', p.last_name)
      if (p.profile_photo_url) setValue('profile_photo_url', p.profile_photo_url)
      if (p.university_name) setValue('university_name', p.university_name)
      if (p.linkedin_url) setValue('linkedin_url', p.linkedin_url)
      if (p.location_text) setValue('location_text', p.location_text)
      setValue('location_lat', p.location_lat)
      setValue('location_lng', p.location_lng)
      if (p.location_scope && ['city', 'state', 'country'].includes(p.location_scope)) {
        setValue('location_scope', p.location_scope as 'city' | 'state' | 'country')
      }
      if (p.batch_year) setValue('batch_year', p.batch_year)
      setValue('host_mode', p.host_mode ?? false)
      if (p.max_guests) setValue('max_guests', p.max_guests)
      if (p.available_from) setValue('available_from', p.available_from)
      if (p.available_to) setValue('available_to', p.available_to)
      setValue('always_available', p.always_available ?? false)
      if (p.phone_number) setValue('phone_number', p.phone_number)
      if (p.profile_visibility && ['everyone', 'same_university', 'same_batch'].includes(p.profile_visibility)) {
        setValue('profile_visibility', p.profile_visibility as 'everyone' | 'same_university' | 'same_batch')
      }
      setInitialDataLoaded(true)
    }
  }, [user, userLoading, setValue, initialDataLoaded])

  const onUniversityChange = (name: string) => setValue('university_name', name)
  const loc = watch(['location_text', 'location_lat', 'location_lng', 'location_scope'])
  const locationValue: LocationValue = {
    location_text: loc[0] || '',
    location_lat: loc[1],
    location_lng: loc[2],
    location_scope: loc[3],
  }
  const onLocationChange = (v: LocationValue) => {
    setValue('location_text', v.location_text)
    setValue('location_lat', v.location_lat)
    setValue('location_lng', v.location_lng)
    setValue('location_scope', v.location_scope)
  }

  const onSubmit = async (data: ProfileInput) => {
    try {
      const payload = data.always_available
        ? { ...data, available_from: null, available_to: null }
        : data
      await updateMyProfile(payload)
      await invalidateUser()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to update profile')
    }
  }

  // Privacy tab functions
  const loadPrivacyRequests = async () => {
    setPrivacyLoading(true)
    const list = await getMyPrivacyRequests()
    setPrivacyItems(list)
    setPrivacyLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'privacy') {
      loadPrivacyRequests()
    }
  }, [activeTab])

  const submitPrivacyRequest = async (type: 'deletion' | 'export') => {
    setPrivacyNotice(null)
    await createPrivacyRequest(type)
    setPrivacyNotice(`${type === 'export' ? 'Data export' : 'Account deletion'} request submitted`)
    loadPrivacyRequests()
  }

  if (userLoading) {
    return (
      <main className="p-3 max-w-2xl mx-auto py-6">
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </main>
    )
  }

  return (
    <main className="p-3 max-w-4xl mx-auto space-y-4 py-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Profile & Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile and privacy preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-semibold transition-all border-b-2 ${activeTab === 'profile'
            ? 'text-primary border-primary'
            : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
        >
          Edit Profile
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 font-semibold transition-all border-b-2 ${activeTab === 'privacy'
            ? 'text-primary border-primary'
            : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
        >
          Privacy & Data
        </button>
      </div>

      {activeTab === 'profile' && (
        <>
          {saveSuccess && (
            <div className="alert-success">
              <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Profile updated successfully!
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            {watch('profile_photo_url') && (
              <div className="flex justify-center">
                <img
                  src={watch('profile_photo_url')}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                />
              </div>
            )}

            {/* Email (non-editable) */}
            {user?.email && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Email</label>
                <input
                  className="w-full bg-gray-50 cursor-not-allowed text-gray-500"
                  value={user.email}
                  disabled
                  readOnly
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">First Name</label>
                <input
                  className="w-full"
                  placeholder="John"
                  {...register('first_name')}
                />
                {errors.first_name && (
                  <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.first_name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Last Name</label>
                <input
                  className="w-full"
                  placeholder="Doe"
                  {...register('last_name')}
                />
                {errors.last_name && (
                  <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            {/* Location - moved above University */}
            <div className="space-y-2">
              <LocationCombobox value={locationValue} onChange={onLocationChange} />
              {errors.location_text && (
                <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.location_text.message}
                </p>
              )}
            </div>

            {/* University - moved below Location */}
            <div className="space-y-2">
              <UniversityCombobox
                value={watch('university_name')}
                onChange={onUniversityChange}
              />
              {errors.university_name && (
                <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.university_name.message}
                </p>
              )}
            </div>

            {/* Batch Year - moved above LinkedIn */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Batch Year</label>
              <input
                className="w-full"
                type="number"
                placeholder="YYYY"
                {...register('batch_year', { valueAsNumber: true })}
              />
              {errors.batch_year && (
                <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.batch_year.message}
                </p>
              )}
            </div>

            {/* LinkedIn - moved below Batch Year */}
            <div className="space-y-2">
              <LinkedInInput
                value={watch('linkedin_url')}
                onChange={(value) => setValue('linkedin_url', value)}
                error={errors.linkedin_url?.message}
              />
              <p className="text-sm text-green-600 font-semibold">✨ Adds Credibility!!!</p>
            </div>

            {/* Phone Number - new field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Phone Number (optional)</label>
              <input
                className="w-full"
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...register('phone_number')}
              />
              <p className="text-xs text-gray-500">...for faster connectivity</p>
            </div>

            {/* Host Mode Toggle - new field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Host Mode</p>
                    <p className="text-sm text-gray-600">Show I'm willing to host fellow alumni</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('host_mode', !watch('host_mode'))}
                  style={{ width: '44px', height: '24px' }}
                  className={`toggle-switch flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${watch('host_mode') ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  role="switch"
                  aria-checked={watch('host_mode')}
                >
                  <span
                    style={{ width: '20px', height: '20px', top: '2px', left: watch('host_mode') ? '22px' : '2px' }}
                    className="absolute rounded-full bg-white shadow transition-all duration-200 ease-in-out"
                  />
                </button>
              </div>
            </div>

            {/* Host capacity + availability - only relevant when Host Mode is on */}
            {watch('host_mode') && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-100">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Max Guests</label>
                  <input
                    className="w-full"
                    type="number"
                    min={1}
                    placeholder="e.g. 2"
                    {...register('max_guests', { valueAsNumber: true })}
                  />
                  {errors.max_guests && (
                    <p className="text-red-600 text-sm font-medium">{errors.max_guests.message}</p>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={!!watch('always_available')}
                    onChange={(e) => setValue('always_available', e.target.checked)}
                  />
                  <span className="text-sm font-semibold text-gray-700">I'm always available</span>
                </label>

                {!watch('always_available') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Available From</label>
                      <input className="w-full" type="date" min={today} {...register('available_from')} />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Available To</label>
                      <input className="w-full" type="date" min={watch('available_from') || today} {...register('available_to')} />
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500">Lets travelers filter for hosts who can fit their group and dates</p>
              </div>
            )}

            {/* Profile Visibility - new field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Profile Visibility</label>
              <select
                className="w-full border-2 border-gray-200 rounded-lg py-2.5 px-3 focus:border-primary focus:ring-primary"
                {...register('profile_visibility')}
              >
                <option value="everyone">Everyone - Visible to all alumni</option>
                <option value="same_university">Same University - Only visible to alumni from my university</option>
                <option value="same_batch">Same Batch - Only visible to alumni from my batch year</option>
              </select>
              <p className="text-xs text-gray-500">Control who can see your profile in search results</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-primary text-black font-bold flex-1 rounded-xl px-4 py-2 shadow-md hover:shadow-lg hover:bg-primary-dark transition-all disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    Save changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="bg-white text-gray-900 font-semibold rounded-xl px-4 py-2 border-2 border-gray-200 hover:border-primary transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}

      {activeTab === 'privacy' && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
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

            <div className="grid md:grid-cols-2 gap-3">
              <button
                className="bg-white text-gray-900 font-semibold rounded-xl px-3 py-2 border-2 border-gray-200 hover:border-primary transition-all text-left flex items-center gap-4 group"
                onClick={() => submitPrivacyRequest('export')}
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
                className="bg-white text-gray-900 font-semibold rounded-xl px-3 py-2 border-2 border-gray-200 hover:border-primary transition-all text-left flex items-center gap-4 group"
                onClick={() => submitPrivacyRequest('deletion')}
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

            {privacyNotice && (
              <div className="alert-success">
                <svg className="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {privacyNotice}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Your Privacy Requests
            </h3>

            {privacyLoading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : privacyItems.length === 0 ? (
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
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {privacyItems.map((it) => (
                      <tr key={it.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 font-mono text-gray-600">#{it.id}</td>
                        <td className="px-3 py-2">
                          <span className={`badge ${it.type === 'export' ? 'badge-primary' : 'badge-pending'}`}>
                            {it.type}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="capitalize text-gray-700 font-medium">{it.status}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{new Date(it.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  )
}
