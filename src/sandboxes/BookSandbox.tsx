import { useMemo, useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// A pocket semantic search: books carry theme keywords (our stand-in for
// embeddings) + emotion scores; query overlap ≈ cosine similarity.
type Book = { title: string; author: string; emoji: string; genre: 'fiction' | 'nonfiction'; themes: string[]; tones: { joy: number; sadness: number; fear: number; surprise: number } }

const BOOKS: Book[] = [
  { title: 'The Kite Runner', author: 'K. Hosseini', emoji: '🪁', genre: 'fiction', themes: ['forgiveness', 'guilt', 'friendship', 'redemption', 'betrayal', 'family', 'war'], tones: { joy: 0.2, sadness: 0.9, fear: 0.5, surprise: 0.4 } },
  { title: 'Project Hail Mary', author: 'A. Weir', emoji: '🚀', genre: 'fiction', themes: ['space', 'science', 'survival', 'friendship', 'discovery', 'adventure', 'alien'], tones: { joy: 0.7, sadness: 0.3, fear: 0.5, surprise: 0.9 } },
  { title: 'Educated', author: 'T. Westover', emoji: '🎓', genre: 'nonfiction', themes: ['family', 'education', 'survival', 'identity', 'freedom', 'memoir'], tones: { joy: 0.3, sadness: 0.7, fear: 0.6, surprise: 0.5 } },
  { title: 'The Martian', author: 'A. Weir', emoji: '🥔', genre: 'fiction', themes: ['space', 'survival', 'science', 'humor', 'problem-solving', 'adventure'], tones: { joy: 0.8, sadness: 0.2, fear: 0.4, surprise: 0.6 } },
  { title: 'Atomic Habits', author: 'J. Clear', emoji: '⚛️', genre: 'nonfiction', themes: ['habits', 'self-improvement', 'discipline', 'psychology', 'success'], tones: { joy: 0.6, sadness: 0.05, fear: 0.05, surprise: 0.3 } },
  { title: 'A Man Called Ove', author: 'F. Backman', emoji: '🏠', genre: 'fiction', themes: ['grief', 'friendship', 'community', 'love', 'redemption', 'humor'], tones: { joy: 0.65, sadness: 0.75, fear: 0.1, surprise: 0.5 } },
  { title: 'Sapiens', author: 'Y. N. Harari', emoji: '🧬', genre: 'nonfiction', themes: ['history', 'science', 'humanity', 'evolution', 'society', 'big-ideas'], tones: { joy: 0.3, sadness: 0.25, fear: 0.3, surprise: 0.8 } },
  { title: 'The Road', author: 'C. McCarthy', emoji: '🛣️', genre: 'fiction', themes: ['survival', 'family', 'apocalypse', 'love', 'hope', 'fear'], tones: { joy: 0.1, sadness: 0.95, fear: 0.9, surprise: 0.3 } },
  { title: 'Born a Crime', author: 'T. Noah', emoji: '🎤', genre: 'nonfiction', themes: ['identity', 'humor', 'family', 'survival', 'memoir', 'apartheid'], tones: { joy: 0.75, sadness: 0.5, fear: 0.4, surprise: 0.6 } },
  { title: 'Dune', author: 'F. Herbert', emoji: '🏜️', genre: 'fiction', themes: ['power', 'politics', 'space', 'destiny', 'ecology', 'adventure', 'war'], tones: { joy: 0.3, sadness: 0.4, fear: 0.6, surprise: 0.7 } },
  { title: 'When Breath Becomes Air', author: 'P. Kalanithi', emoji: '🫁', genre: 'nonfiction', themes: ['mortality', 'meaning', 'medicine', 'love', 'grief', 'memoir'], tones: { joy: 0.25, sadness: 0.95, fear: 0.5, surprise: 0.2 } },
  { title: 'Good Omens', author: 'Gaiman & Pratchett', emoji: '😇', genre: 'fiction', themes: ['humor', 'apocalypse', 'friendship', 'religion', 'satire'], tones: { joy: 0.9, sadness: 0.1, fear: 0.2, surprise: 0.8 } },
]

const SUGGESTIONS = ['a story about forgiveness', 'surviving against all odds in space', 'something funny about the end of the world', 'a memoir about identity and family']

export default function BookSandbox() {
  const touch = useSandboxTouch('books')
  const [q, setQ] = useState('')
  const [genre, setGenre] = useState<'all' | 'fiction' | 'nonfiction'>('all')
  const [tone, setTone] = useState<'none' | keyof Book['tones']>('none')

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/[^a-z-]+/).filter((w) => w.length > 2)
    return BOOKS
      .filter((b) => genre === 'all' || b.genre === genre)
      .map((b) => {
        const hits = b.themes.filter((t) => words.some((w) => t.includes(w) || w.includes(t)))
        let score = words.length ? hits.length / Math.sqrt(words.length) : 0.3
        if (tone !== 'none') score = score * 0.55 + b.tones[tone] * 0.45
        return { b, score, hits }
      })
      .sort((a, x) => x.score - a.score)
      .slice(0, 6)
  }, [q, genre, tone])

  return (
    <SandboxShell
      id="books"
      title="book-recsys — search by meaning, rank by feeling"
      note="the real system embeds full descriptions with OpenAI embeddings into Chroma and scores emotions with a GoEmotions transformer. This pocket edition matches on curated theme vectors — same ranking recipe (similarity ⊕ tone), 12-book universe."
    >
      <div className="sb-col">
        <div className="sb-row">
          <input
            className="sb-input" style={{ flex: 1, minWidth: 240 }}
            placeholder='describe a story… e.g. "a story about forgiveness"'
            value={q}
            onChange={(e) => { touch(); setQ(e.target.value) }}
          />
          <select className="sb-select" value={genre} onChange={(e) => { touch(); setGenre(e.target.value as typeof genre) }}>
            <option value="all">all genres</option>
            <option value="fiction">fiction</option>
            <option value="nonfiction">nonfiction</option>
          </select>
          <select className="sb-select" value={tone} onChange={(e) => { touch(); setTone(e.target.value as typeof tone) }}>
            <option value="none">any tone</option>
            <option value="joy">rank by joy</option>
            <option value="sadness">rank by sadness</option>
            <option value="fear">rank by fear</option>
            <option value="surprise">rank by surprise</option>
          </select>
        </div>
        <div className="sb-row" style={{ fontSize: 11.5 }}>
          <span className="t-sys" style={{ color: 'var(--dim)' }}>try:</span>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="term-link" style={{ fontSize: 11.5 }} onClick={() => { touch(); setQ(s) }}>“{s}”</button>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', marginTop: 6 }}>
          {results.map(({ b, score, hits }) => (
            <div key={b.title} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 14, background: 'var(--panel)' }}>
              <div style={{ fontSize: 26 }}>{b.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{b.title}</div>
              <div className="mono-note">{b.author} · {b.genre}</div>
              <div className="hbar" style={{ marginTop: 8 }}>
                <span className="track"><i className="fill" style={{ width: `${Math.min(100, score * 100)}%`, background: score > 0.6 ? 'var(--green)' : 'var(--accent)' }} /></span>
                <span className="val">{(score * 100).toFixed(0)}%</span>
              </div>
              {hits.length > 0 && <div className="mono-note" style={{ marginTop: 4 }}>matched: {hits.join(', ')}</div>}
            </div>
          ))}
        </div>
      </div>
    </SandboxShell>
  )
}
