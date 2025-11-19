'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { graphqlClient } from '@/lib/graphql/client'

type University = { name: string; state?: string | null; country?: string; external_id?: string | null }

const UNIVERSITIES_US = `
  query UniversitiesUS($q: String) {
    universitiesUS(q: $q) { name state country external_id }
  }
` as const

export interface UniversityComboboxProps {
  value?: string
  onChange: (name: string) => void
}

export default function UniversityCombobox({ value, onChange }: UniversityComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [universities, setUniversities] = React.useState<University[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let canceled = false
    async function fetchUniversities() {
      setLoading(true)
      try {
        // When search is empty, fetch "Institute" to get top results
        const searchTerm = search.trim() || 'Institute'
        const result = await graphqlClient
          .query<{ universitiesUS: University[] }, { q?: string }>(UNIVERSITIES_US, { q: searchTerm })
          .toPromise()
        if (!canceled) {
          setUniversities(result.data?.universitiesUS ?? [])
        }
      } catch {
        if (!canceled) setUniversities([])
      } finally {
        if (!canceled) setLoading(false)
      }
    }
    fetchUniversities()
    return () => {
      canceled = true
    }
  }, [search])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">University</label>
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-start text-left font-normal gap-0 h-[50px] px-4 border-2 border-gray-200 hover:border-gray-300 text-base"
            >
              <span className={`flex-1 truncate text-left text-base ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                {value || "Select university..."}
              </span>
              {!value && <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />}
            </Button>
          </PopoverTrigger>
        <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search university..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading && (
                <CommandEmpty>
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </div>
                </CommandEmpty>
              )}
              {!loading && universities.length === 0 && search.length > 2 && (
                <CommandEmpty>
                  <div className="text-gray-500">
                    No results for &quot;{search}&quot;
                  </div>
                </CommandEmpty>
              )}
              <CommandGroup heading={!search.trim() && universities.length > 0 ? "Top Universities" : undefined}>
                {universities.map((university) => {
                  const parts = [university.name]
                  if (university.state) parts.push(university.state)
                  if (university.country) parts.push(university.country)
                  const displayName = parts.join(', ')
                  return (
                    <CommandItem
                      key={`${university.name}-${university.state ?? ''}`}
                      value={university.name}
                      onSelect={(currentValue) => {
                        onChange(currentValue === value ? '' : currentValue)
                        setOpen(false)
                      }}
                      className="text-base py-3"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === university.name ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {displayName}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
        </Popover>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
            title="Clear university"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
