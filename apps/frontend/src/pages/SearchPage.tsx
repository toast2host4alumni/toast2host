import { useCallback, useEffect, useMemo, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import SearchResults from '@/components/SearchResults'
import { useSearch } from '@/hooks/useSearch'
import AuthGuard from '@/components/AuthGuard'
import LocationCombobox, { type LocationValue } from '@/components/LocationCombobox'
import UniversityCombobox from '@/components/UniversityCombobox'
import UniversityMultiSelect from '@/components/UniversityMultiSelect'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCurrentUser } from '@/hooks/useCurrentUser'

function SearchContent() {
  const { data: user } = useCurrentUser()
  const [searchMode, setSearchMode] = useState<'all' | 'same_university' | 'same_batch'>('all')
  const [locationValue, setLocationValue] = useState<LocationValue>({
    location_text: '',
    location_lat: undefined,
    location_lng: undefined,
    location_scope: 'city',
  })
  const [university, setUniversity] = useState<string>('')
  const [universities, setUniversities] = useState<string[]>([])
  const [batchYear, setBatchYear] = useState<number | undefined>(undefined)
  const [travelDateFrom, setTravelDateFrom] = useState<string>('')
  const [travelDateTo, setTravelDateTo] = useState<string>('')
  const [guests, setGuests] = useState<number | undefined>(undefined)
  const [sort, setSort] = useState<'proximity' | 'recent' | 'name'>('recent')
  const [connectedOnly, setConnectedOnly] = useState(false)
  // Defaults to true - this is a booking tool, so the primary search experience
  // should surface people who are actually accepting guests. The toggle lets
  // guests opt into browsing the full alumni directory instead.
  const [hostsOnly, setHostsOnly] = useState(true)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  // Auto-set filters based on search mode
  useEffect(() => {
    if (!user?.profile) return

    if (searchMode === 'same_university') {
      setUniversity(user.profile.university_name || '')
      setUniversities([]) // Clear multi-select
      setBatchYear(undefined)
    } else if (searchMode === 'same_batch') {
      setUniversity(user.profile.university_name || '')
      setUniversities([]) // Clear multi-select
      setBatchYear(user.profile.batch_year || undefined)
    } else if (searchMode === 'all') {
      // Clear university and batch filters when "All Universities" is selected
      setUniversity('')
      setUniversities([])
      setBatchYear(undefined)
    }
  }, [searchMode, user])

  const onLocationChange = useCallback((v: LocationValue) => {
    setLocationValue(v)
  }, [])

  const onUniversityChange = useCallback((name: string) => {
    setUniversity(name)
  }, [])

  const params = useMemo(() => ({
    location: locationValue.location_text || undefined,
    lat: locationValue.location_lat,
    lng: locationValue.location_lng,
    scope: locationValue.location_scope || 'city',
    university: university || undefined,
    universities: universities.length > 0 ? universities : undefined,
    batch_year: batchYear,
    sort,
    connected_only: connectedOnly || undefined,
    hosts_only: hostsOnly || undefined,
    travel_date_from: travelDateFrom || undefined,
    travel_date_to: travelDateTo || undefined,
    guests,
  }), [locationValue, university, universities, batchYear, sort, connectedOnly, hostsOnly, travelDateFrom, travelDateTo, guests])

  const { data, fetchNextPage, hasNextPage, isFetching, refetch } = useSearch(params, 20)

  const items = (data?.pages ?? []).flatMap((p) => p.items)

  const activeFilterCount = (searchMode !== 'all' ? 1 : 0) + (batchYear ? 1 : 0) + (universities.length > 0 ? 1 : 0)

  return (
    <main className="p-3 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-4xl font-black text-gray-900">Find Alumni</h1>
        <p className="text-gray-600 mt-2">Connect with alumni from universities around the world</p>
      </div>

      {/* Results */}
      <div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 min-h-[500px]">
          {/* Search Filters - Always visible */}
          <div className="mb-4 pb-3 border-b border-gray-200 space-y-3">
            {/* Row 1: Where / When / Who - single Airbnb-style pill row, + Filters button */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] rounded-lg border-2 border-gray-200 divide-y md:divide-y-0 md:divide-x divide-gray-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] bg-white">
              <LocationCombobox value={locationValue} onChange={onLocationChange} label="Where do you want to go?" variant="bare" />

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex flex-col items-start px-3 py-2 text-left rounded-lg transition-colors hover:bg-gray-50 data-[state=open]:bg-primary/5 data-[state=open]:ring-2 data-[state=open]:ring-inset data-[state=open]:ring-primary"
                  >
                    <span className="text-xs font-semibold text-gray-700">When</span>
                    <span className={`text-sm truncate ${travelDateFrom && travelDateTo ? 'text-gray-900' : 'text-gray-400'}`}>
                      {travelDateFrom && travelDateTo ? `${travelDateFrom} → ${travelDateTo}` : 'Add dates'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="start">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">Check-in</label>
                      <input
                        type="date"
                        className="w-full"
                        value={travelDateFrom}
                        onChange={(e) => setTravelDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">Check-out</label>
                      <input
                        type="date"
                        className="w-full"
                        value={travelDateTo}
                        min={travelDateFrom || undefined}
                        onChange={(e) => setTravelDateTo(e.target.value)}
                      />
                    </div>
                    {(travelDateFrom || travelDateTo) && (
                      <button
                        type="button"
                        onClick={() => { setTravelDateFrom(''); setTravelDateTo('') }}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline"
                      >
                        Clear dates
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex flex-col items-start px-3 py-2 text-left rounded-lg transition-colors hover:bg-gray-50 data-[state=open]:bg-primary/5 data-[state=open]:ring-2 data-[state=open]:ring-inset data-[state=open]:ring-primary"
                  >
                    <span className="text-xs font-semibold text-gray-700">Who</span>
                    <span className={`text-sm truncate ${guests ? 'text-gray-900' : 'text-gray-400'}`}>
                      {guests ? `${guests} guest${guests > 1 ? 's' : ''}` : 'Add guests'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Guests</p>
                      <p className="text-xs text-gray-500">How many are traveling?</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuests((g) => {
                          const next = (g ?? 0) - 1
                          return next <= 0 ? undefined : next
                        })}
                        disabled={!guests}
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-400 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-semibold text-gray-900">{guests ?? 0}</span>
                      <button
                        type="button"
                        onClick={() => setGuests((g) => (g ?? 0) + 1)}
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Filters button - Search Mode, Batch Year, University live in this panel */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-200 bg-white hover:border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-sm font-semibold text-gray-700 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-black text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-sm">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-4" align="end">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Search Mode</label>
                  <div className="relative">
                    <select
                      className="w-full border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-primary py-2 px-3 pr-8 text-base appearance-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] bg-white !bg-none"
                      value={searchMode}
                      onChange={(e) => setSearchMode(e.target.value as 'all' | 'same_university' | 'same_batch')}
                    >
                      <option value="all">Across All Universities</option>
                      <option value="same_university">From Same Alma Mater</option>
                      <option value="same_batch">From Same Batch</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Batch Year</label>
                  <input
                    type="number"
                    className="w-full border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-primary py-2 px-3 text-base shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                    value={batchYear ?? ''}
                    onChange={(e) => setBatchYear(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Any"
                    min={1900}
                    max={2100}
                  />
                </div>
                {searchMode === 'all' && (
                  <UniversityMultiSelect value={universities} onChange={setUniversities} label="Choose Alumni host from" />
                )}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSearchMode('all'); setBatchYear(undefined); setUniversities([]) }}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear filters
                  </button>
                )}
              </PopoverContent>
            </Popover>
            </div>

            {/* Mobile: Additional filters */}
            <div className="block md:hidden space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sort by</label>
                <div className="relative">
                  <select
                    className="w-full text-sm border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-primary py-2 px-3 pr-8 appearance-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] bg-white !bg-none"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as 'proximity' | 'recent' | 'name')}
                  >
                    <option value="recent">Recent</option>
                    <option value="proximity">Proximity</option>
                    <option value="name">Name A-Z</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  onClick={() => setConnectedOnly(!connectedOnly)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors group"
                >
                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${connectedOnly
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-300 group-hover:border-gray-400'
                    }`}>
                    <svg className={`w-3 h-3 text-black transition-opacity ${connectedOnly ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>Show only my previous hosts</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHostsOnly(!hostsOnly)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors group"
                >
                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${hostsOnly
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-300 group-hover:border-gray-400'
                    }`}>
                    <svg className={`w-3 h-3 text-black transition-opacity ${hostsOnly ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Show only hosts
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <p className="text-sm text-gray-600 font-medium">
                  Found <span className="text-primary font-bold">{items.length}</span> alumni
                </p>
                {isFetching && (
                  <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>
            </div>

            {/* Desktop: Hide Connections (left) | Found count (center) | Sort, View Toggle (right) */}
            <div className="hidden md:flex flex-wrap items-center justify-between gap-3 min-h-[40px]">
              {/* Left: Filter Connections */}
              <div className="flex items-center gap-12">
                <button
                  type="button"
                  onClick={() => setConnectedOnly(!connectedOnly)}
                  className="inline-flex items-center gap-3 text-sm font-medium text-gray-600 cursor-pointer select-none whitespace-nowrap hover:text-gray-900 transition-colors group"
                >
                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${connectedOnly
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-300 group-hover:border-gray-400'
                    }`}>
                    <svg className={`w-3 h-3 text-black transition-opacity ${connectedOnly ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>Show only my previous hosts</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHostsOnly(!hostsOnly)}
                  className="inline-flex items-center gap-3 text-sm font-medium text-gray-600 cursor-pointer select-none whitespace-nowrap hover:text-gray-900 transition-colors group"
                >
                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${hostsOnly
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-300 group-hover:border-gray-400'
                    }`}>
                    <svg className={`w-3 h-3 text-black transition-opacity ${hostsOnly ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Show only hosts
                  </span>
                </button>
              </div>

              {/* Center: Found count */}
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600 font-medium">
                  Found <span className="text-primary font-bold">{items.length}</span> alumni
                </p>
                {isFetching && (
                  <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>

              {/* Right: Sort + View Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">Sort by:</span>
                <div className="relative">
                  <select
                    className="text-sm border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-primary py-1.5 px-3 pr-8 appearance-none shadow-[0_1px_2px_rgba(0,0,0,0.05)] bg-white !bg-none"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as 'proximity' | 'recent' | 'name')}
                  >
                    <option value="recent">Recently Updated</option>
                    <option value="proximity">Proximity</option>
                    <option value="name">Name A-Z</option>
                  </select>
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>

                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    title="Card View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    title="List View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isFetching && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <svg className="animate-spin h-10 w-10 text-primary mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="font-medium">Searching for alumni...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold text-gray-700 mb-1">No results found</p>
              <p className="text-sm">Try adjusting your filters or search criteria</p>
            </div>
          ) : (
            <>
              <SearchResults
                items={items}
                onAfterConnect={() => refetch()}
                viewMode={viewMode}
                travelDateFrom={travelDateFrom || undefined}
                travelDateTo={travelDateTo || undefined}
                guests={guests}
              />
              {hasNextPage && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetching}
                    className="bg-white text-gray-900 font-semibold px-6 py-2.5 rounded-xl border-2 border-gray-200 hover:border-primary transition-all disabled:opacity-50"
                  >
                    {isFetching ? 'Loading...' : 'Load more results'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <AuthGuard>
      <SearchContent />
    </AuthGuard>
  )
}
