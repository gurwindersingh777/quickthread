import { useState, type FormEvent } from 'react'
import { useMatch, useNavigate, useSearchParams } from 'react-router'
import { Search, X } from 'lucide-react'
import { Input } from '../ui/input'

function SearchForm({ initial }: { initial: string }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const match = useMatch('/app/inbox/:segment/*')
  const [value, setValue] = useState(initial)

  const go = (q: string) => {
    const segment = match?.params.segment ?? 'all'
    // Keep the current filters when searching inside the inbox
    const next = new URLSearchParams(match ? params : undefined)
    if (q) next.set('q', q)
    else next.delete('q')
    const qs = next.toString()
    navigate(`/app/inbox/${segment}${qs ? `?${qs}` : ''}`)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    go(value.trim())
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-md" role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search conversations"
        className="pl-9 pr-9"
        aria-label="Search conversations"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('')
            go('')
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}

export function HeaderSearch() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  // The key re-creates the form whenever the URL's search term changes
  return <SearchForm key={q} initial={q} />
}