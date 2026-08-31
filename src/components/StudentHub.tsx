import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Building2, Clock3, ExternalLink, GraduationCap, IndianRupee, Loader2, MapPin, Search, Sparkles } from 'lucide-react';
import { buildRecommendationSuggestions, searchJobsLive, type SearchKind, type SearchResultJob } from '@/services/jobSearchService';

type Props = { onToast: (message: string, submessage?: string) => void; onRequireAuth?: (feature: string) => void };
type PaySnapshot = { id: string; query: string; kind: SearchKind; count: number; average: number | null; recordedAt: string };
const HISTORY_KEY = 'ayush-live-pay-history';

function parseMonthlyPay(value: string): number | null {
  const numbers = Array.from(value.matchAll(/(?:₹|INR\s?)([\d,]+(?:\.\d+)?)/gi)).map((match) => Number(match[1].replace(/,/g, ''))).filter(Number.isFinite);
  if (!numbers.length || /year|annual|lpa/i.test(value)) return null;
  return Math.round(numbers.reduce((total, current) => total + current, 0) / numbers.length);
}
function formatPay(value: number | null) { return value === null ? 'Pay not disclosed' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value); }

export function StudentHub(_props: Props) {
  const [kind, setKind] = useState<SearchKind>('jobs');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<SearchResultJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PaySnapshot[]>([]);

  useEffect(() => {
    try { const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as PaySnapshot[]; if (Array.isArray(stored)) setHistory(stored.slice(0, 8)); }
    catch { localStorage.removeItem(HISTORY_KEY); }
  }, []);

  const suggestions = useMemo(() => buildRecommendationSuggestions(query, 'All Skills').slice(0, 6), [query]);
  const closestMatch = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 3) return '';
    return suggestions.find((item) => item.toLowerCase() !== normalized && (item.toLowerCase().includes(normalized) || normalized.includes(item.toLowerCase()))) ?? suggestions[0] ?? '';
  }, [query, suggestions]);

  const runSearch = async (value = query) => {
    const cleanQuery = value.trim();
    if (!cleanQuery) return;
    setQuery(cleanQuery); setSubmittedQuery(cleanQuery); setLoading(true);
    try {
      const liveResults = await searchJobsLive(cleanQuery, 'All Skills', kind);
      setResults(liveResults);
      const values = liveResults.map((item) => parseMonthlyPay(item.stipend)).filter((value): value is number => value !== null);
      const snapshot: PaySnapshot = { id: `${Date.now()}-${kind}`, query: cleanQuery, kind, count: liveResults.length, average: values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : null, recordedAt: new Date().toISOString() };
      setHistory((current) => { const next = [snapshot, ...current.filter((item) => !(item.query.toLowerCase() === cleanQuery.toLowerCase() && item.kind === kind))].slice(0, 8); localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); return next; });
    } finally { setLoading(false); }
  };
  const switchKind = (nextKind: SearchKind) => { setKind(nextKind); setResults([]); setSubmittedQuery(''); };
  const activeHistory = history.filter((item) => item.kind === kind);
  const FinderIcon = kind === 'jobs' ? BriefcaseBusiness : GraduationCap;
  const finderLabel = kind === 'jobs' ? 'Job Finder' : 'Internship Finder';

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
      <div className="max-w-3xl">
        <div className="mb-5 inline-flex rounded-xl bg-white/10 p-1 backdrop-blur-sm">
          <button type="button" onClick={() => switchKind('jobs')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${kind === 'jobs' ? 'bg-white text-emerald-800 shadow-sm' : 'text-white/80 hover:text-white'}`}><BriefcaseBusiness className="h-4 w-4" /> Job Finder</button>
          <button type="button" onClick={() => switchKind('internships')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${kind === 'internships' ? 'bg-white text-emerald-800 shadow-sm' : 'text-white/80 hover:text-white'}`}><GraduationCap className="h-4 w-4" /> Internship Finder</button>
        </div>
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><FinderIcon className="h-6 w-6" /></div><div><h2 className="text-2xl font-bold">{finderLabel}</h2><p className="mt-0.5 text-sm text-emerald-50">Live listings from web providers, with details kept here.</p></div></div>
        <form onSubmit={(event) => { event.preventDefault(); void runSearch(); }} className="mt-6"><div className="flex rounded-2xl bg-white p-1.5 shadow-lg shadow-emerald-950/20"><Search className="ml-3 h-5 w-5 self-center text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={kind === 'jobs' ? 'Search roles, skills, companies, or locations' : 'Search internships, skills, companies, or locations'} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" /><button type="submit" disabled={!query.trim() || loading} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}</button></div></form>
        {closestMatch && query.trim() && <button type="button" onClick={() => void runSearch(closestMatch)} className="mt-3 text-sm text-emerald-50 underline decoration-emerald-200/70 underline-offset-4 hover:text-white">Did you mean <span className="font-semibold">{closestMatch}</span>?</button>}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-100/80">Try searching for</p>
          <div className="flex flex-wrap gap-2">{suggestions.slice(0, 6).map((suggestion) => <button key={suggestion} type="button" onClick={() => { setQuery(suggestion); void runSearch(suggestion); }} className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/20 hover:border-white/40">{suggestion}</button>)}</div>
        </div>
      </div>
    </section>
    {submittedQuery && <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Live {kind === 'jobs' ? 'job' : 'internship'} results</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Results for “{submittedQuery}”</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><Sparkles className="h-3.5 w-3.5" /> Live web search</span></div>{loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div> : results.length ? <div className="space-y-3">{results.map((result) => <LiveListingCard key={result.id} result={result} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900"><p className="font-medium text-slate-700 dark:text-slate-200">No listings found.</p><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try a broader search or different keywords.</p></div>}</section>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-2.5 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"><IndianRupee className="h-5 w-5" /></div><div><h3 className="font-semibold text-slate-800 dark:text-slate-100">Live pay history</h3><p className="text-xs text-slate-500 dark:text-slate-400">A private record of compensation shown in your live searches.</p></div></div>{activeHistory.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{activeHistory.map((item) => <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/70"><p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{item.query}</p><p className="mt-2 text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatPay(item.average)}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.count} listings · {new Date(item.recordedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p></div>)}</div> : <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Search live listings to start your pay history.</p>}</section>
  </div>;
}

function LiveListingCard({ result }: { result: SearchResultJob }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{result.title}</h4><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{result.platform || result.source}</span></div><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300"><Building2 className="h-4 w-4" /> {result.company}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400"><span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {result.location}</span><span className="flex items-center gap-1.5"><IndianRupee className="h-4 w-4" /> {result.stipend}</span><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> Live listing</span></div>{result.description && <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{result.description}</p>}<div className="mt-3 flex flex-wrap gap-1.5">{result.skills.slice(0, 6).map((skill) => <span key={skill} className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{skill}</span>)}</div></div>{result.external_url ? <a href={result.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"><ExternalLink className="h-4 w-4" /> View listing</a> : <span className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-400 dark:border-slate-700">Listing link unavailable</span>}</div></article>;
}
