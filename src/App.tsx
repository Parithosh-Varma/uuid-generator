import { useState, useEffect } from 'react'

function makeUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
  return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`
}

function formatUuid(u: string, upper: boolean, hyphens: boolean, quotes: boolean): string {
  let out = hyphens ? u : u.replace(/-/g, '')
  if (upper) out = out.toUpperCase()
  if (quotes) out = `"${out}"`
  return out
}

type CopyTarget = 'all' | 'one'

const HISTORY_KEY = 'uuid-generator-history'

interface HistoryItem {
  value: string
  count: number
  at: number
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') return 'dark'
    if (saved === 'light') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [count, setCount] = useState(1)
  const [upper, setUpper] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [quotes, setQuotes] = useState(false)
  const [uuids, setUuids] = useState<string[]>([])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    regenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, upper, hyphens, quotes])

  const regenerate = () => {
    const n = Math.min(1000, Math.max(1, count))
    setUuids(Array.from({ length: n }, () => formatUuid(makeUuid(), upper, hyphens, quotes)))
  }

  const copy = async (target: CopyTarget, value?: string) => {
    const text = target === 'one' && value !== undefined ? value : uuids.join('\n')
    if (!text) return
    await navigator.clipboard.writeText(text)
    setFeedback(target === 'one' ? 'Copied 1 UUID' : `Copied ${uuids.length} UUIDs`)
    window.setTimeout(() => setFeedback(''), 1500)
  }

  const [feedback, setFeedback] = useState('')

  const download = (fmt: 'txt' | 'json' | 'csv') => {
    if (uuids.length === 0) return
    let content = ''
    let mime = 'text/plain'
    let ext = 'txt'
    if (fmt === 'json') {
      content = JSON.stringify(uuids, null, 2)
      mime = 'application/json'
      ext = 'json'
    } else if (fmt === 'csv') {
      content = uuids.map((u) => (u.includes(',') ? `"${u}"` : u)).join('\n')
      mime = 'text/csv'
      ext = 'csv'
    } else {
      content = uuids.join('\n') + '\n'
    }
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `uuids-${Date.now()}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const saveHistory = () => {
    if (uuids.length === 0) return
    const existing: HistoryItem[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    const item: HistoryItem = { value: uuids[0], count: uuids.length, at: Date.now() }
    existing.unshift(item)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.slice(0, 25)))
  }

  const history: HistoryItem[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as HistoryItem[]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 sm:px-8 py-4 border-b border-border bg-card/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full object-cover border border-border shadow-sm" />
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">UUID Generator</h1>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/parithosh-varma/uuid-generator"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold transition-all border border-border bg-background hover:bg-muted text-foreground rounded-lg shadow-sm hover:border-muted-foreground/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            <span className="hidden sm:inline">Repo</span>
          </a>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="inline-flex items-center justify-center w-9 h-9 border border-border bg-background hover:bg-muted text-foreground rounded-lg transition-all hover:border-muted-foreground/30 shadow-sm"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 sm:px-8 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Generate random UUIDs</h2>
            <p className="text-muted-foreground mt-1">Cryptographically secure UUID v4 — generated locally with the Web Crypto API.</p>
          </div>
          <button
            onClick={() => { regenerate(); saveHistory() }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
            Regenerate
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card shadow-sm">
            <label className="text-sm font-semibold text-muted-foreground">Count</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
              className="w-20 bg-transparent text-center font-mono text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            />
          </div>
          {([
            ['uppercase', upper, setUpper],
            ['hyphens', hyphens, setHyphens],
            ['quotes', quotes, setQuotes],
          ] as const).map(([label, val, setter]) => (
            <button
              key={label}
              onClick={() => setter(!val)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${val ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'}`}>
                {val && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3"><path d="M20 6 9 17l-5-5"/></svg>}
              </span>
              {label}
            </button>
          ))}
        </div>

        <div className="border border-border rounded-2xl bg-card shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Results</span>
              {feedback && <span className="text-xs font-bold text-primary animate-pulse">{feedback}</span>}
            </div>
            <div className="flex items-center gap-2">
              {(['txt', 'json', 'csv'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => download(f)}
                  disabled={uuids.length === 0}
                  className="px-2.5 py-1 text-xs font-bold uppercase tracking-wide rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all disabled:opacity-40"
                >
                  .{f}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto p-4 font-mono text-sm leading-relaxed">
            {uuids.length === 0 ? (
              <span className="text-muted-foreground/60">Click Generate to create UUIDs.</span>
            ) : (
              <div className="space-y-1.5">
                {uuids.map((u, i) => (
                  <div key={`${u}-${i}`} className="flex items-center justify-between gap-3 group hover:bg-muted/50 rounded-lg px-2 py-1 transition-colors">
                    <span className="truncate">{u}</span>
                    <button
                      onClick={() => copy('one', u)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border"
                      aria-label="Copy this UUID"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <span className="text-xs text-muted-foreground font-medium">{uuids.length} generated · UUID v4 · RFC 4122</span>
            <button
              onClick={() => copy('all')}
              disabled={uuids.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              Copy all
            </button>
          </div>
        </div>

        <div className="border border-border rounded-2xl bg-card p-5 shadow-sm">
          <h3 className="font-bold tracking-tight mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-primary"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
            History
          </h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Batches you regenerate are saved locally for quick reuse.</p>
          ) : (
            <div className="space-y-2 mt-3">
              {history.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center justify-between gap-3 font-mono text-xs border border-border rounded-lg px-3 py-2 bg-background/50">
                  <div className="truncate">
                    <span className="font-bold text-primary">{h.value}</span>
                    <span className="text-muted-foreground"> · {h.count} UUIDs</span>
                  </div>
                  <span className="text-muted-foreground/60 shrink-0">{new Date(h.at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-8 border-t border-border text-sm text-muted-foreground">
        <p>Built with ❤️ by <a href="https://github.com/parithosh-varma" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">Parithosh Varma</a></p>
      </footer>
    </div>
  )
}

export default App