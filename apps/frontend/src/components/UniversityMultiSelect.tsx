'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
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

export interface UniversityMultiSelectProps {
  value?: string[]
  onChange: (names: string[]) => void
  label?: string
}

export default function UniversityMultiSelect({ value = [], onChange, label = 'Universities' }: UniversityMultiSelectProps) {
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

  const handleSelect = (universityName: string) => {
    if (value.includes(universityName)) {
      onChange(value.filter(v => v !== universityName))
    } else {
      onChange([...value, universityName])
    }
  }

  const handleRemove = (universityName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== universityName))
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-start text-left font-normal gap-0 min-h-[50px] h-auto px-4 py-2 border-2 border-gray-200 hover:border-gray-300 text-base"
            >
              <div className="flex-1 flex flex-wrap gap-2 py-1">
                {value.length === 0 ? (
                  <span className="text-gray-400">Select universities...</span>
                ) : (
                  value.map(uni => {
                    // Extract just the university name before any parentheses or extra info
                    const shortName = uni.split('(')[0].trim() || uni
                    // Truncate if still too long
                    const displayName = shortName.length > 40 ? shortName.substring(0, 37) + '...' : shortName

                    return (
                      <span
                        key={uni}
                        className="inline-flex items-center gap-1 bg-primary/10 text-black px-2 py-1 rounded-md text-sm font-medium max-w-xs"
                        title={uni}
                      >
                        <span className="truncate">{displayName}</span>
                        <button
                          onClick={(e) => handleRemove(uni, e)}
                          className="hover:bg-primary/20 rounded-full p-0.5 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })
                )}
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
            </Button>
          </PopoverTrigger>
        <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search universities..."
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
                  const isSelected = value.includes(university.name)
                  return (
                    <CommandItem
                      key={`${university.name}-${university.state ?? ''}`}
                      value={university.name}
                      onSelect={() => handleSelect(university.name)}
                      className="text-base py-3"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
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
      </div>
      {value.length > 0 && (
        <p className="text-xs text-gray-500">
          {value.length} {value.length === 1 ? 'university' : 'universities'} selected
        </p>
      )}
    </div>
  )
}
