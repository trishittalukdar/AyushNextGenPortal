import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search,
  MapPin,
  Building2,
  Wallet,
  Zap,
  Navigation,
  Clock,
  Award,
  GraduationCap,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Briefcase,
  Filter,
  Globe,
} from 'lucide-react';
import { supabase, FALLBACK_CHECKINS, FALLBACK_JOBS, type Job, type CheckIn } from '@/lib/supabase';
import { calculateAsqFit, STUDENT_SKILLS } from '@/lib/asq';
import { JOB_CATEGORIES, SEARCH_CHIPS, type JobCategory } from '@/lib/skills';
import { searchJobs, searchJobsLive, deriveSkillTags, buildRecommendationSuggestions, type SearchResultJob } from '@/services/jobSearchService';
import { useAuth } from '@/context/AuthContext';

type Props = {
  onToast: (message: string, submessage?: string) => void;
  onRequireAuth?: (feature: string) => void;
};

const STUDENT = {
  name: 'Trishit Talukdar',
  institution: 'Ayush Stream Academy',
};

const sourceLabels: Record<string, string> = {
  linkedin: 'LinkedIn',
  naukri: 'Naukri',
  ncs: 'National Career Service',
  indeed: 'Indeed',
  glassdoor: 'Glassdoor',
  employer: 'Direct from Employer',
};

const sourceColors: Record<string, string> = {
  linkedin: 'bg-blue-50 text-blue-700 border-blue-200',
  naukri: 'bg-amber-50 text-amber-700 border-amber-200',
  ncs: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  indeed: 'bg-slate-100 text-slate-700 border-slate-300',
  glassdoor: 'bg-green-50 text-green-700 border-green-200',
  employer: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const categoryColors: Record<string, string> = {
  'Tech/Software': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  'Healthcare & Ayush': 'bg-teal-50 text-teal-600 border-teal-200',
  'Core Engineering': 'bg-orange-50 text-orange-600 border-orange-200',
  'Business & Finance': 'bg-rose-50 text-rose-600 border-rose-200',
  'Government & Public': 'bg-slate-100 text-slate-600 border-slate-300',
};

const isExternal = (job: Job) => job.source !== 'employer' && !!job.external_url;

export function StudentHub({ onToast, onRequireAuth }: Props) {
  const { isAuthenticated, user, updateProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All Skills');
  const [loading, setLoading] = useState(true);
  const [liveSearchJobs, setLiveSearchJobs] = useState<SearchResultJob[]>([]);
  const [candidateJobs, setCandidateJobs] = useState<SearchResultJob[]>([]);
  const [liveSearchLoading, setLiveSearchLoading] = useState(false);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState('Ayurvedic Medical Officer');
  const [skillsInput, setSkillsInput] = useState('Panchakarma, Clinical Diagnosis, Herbal Formulation');
  const [experienceValue, setExperienceValue] = useState('2');
  const [experienceUnit, setExperienceUnit] = useState<'Days' | 'Months' | 'Years'>('Years');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');
  const [verifiedClinicalHours, setVerifiedClinicalHours] = useState(user?.verifiedClinicalHours ?? 34);
  const [skillMatchIndex, setSkillMatchIndex] = useState(user?.skillMatchIndex ?? 88);

  useEffect(() => {
    if (user) {
      setVerifiedClinicalHours(user.verifiedClinicalHours ?? 34);
      setSkillMatchIndex(user.skillMatchIndex ?? 88);
    }
  }, [user]);

  const persistMetrics = useCallback(async (nextSkillMatchIndex: number, nextVerifiedClinicalHours: number) => {
    if (!isAuthenticated || !user) return;

    await updateProfile({
      skillMatchIndex: nextSkillMatchIndex,
      verifiedClinicalHours: nextVerifiedClinicalHours,
    });
  }, [isAuthenticated, updateProfile, user]);

  const handleMetricChange = useCallback(async (type: 'skillMatchIndex' | 'verifiedClinicalHours', nextValue: number) => {
    if (type === 'skillMatchIndex') {
      const normalizedValue = Math.min(100, Math.max(0, Number.isFinite(nextValue) ? nextValue : 0));
      setSkillMatchIndex(normalizedValue);
      if (isAuthenticated) {
        await persistMetrics(normalizedValue, verifiedClinicalHours);
      }
      return;
    }

    const normalizedValue = Math.max(0, Number.isFinite(nextValue) ? nextValue : 0);
    setVerifiedClinicalHours(normalizedValue);
    if (isAuthenticated) {
      await persistMetrics(skillMatchIndex, normalizedValue);
    }
  }, [isAuthenticated, persistMetrics, skillMatchIndex, verifiedClinicalHours]);

  const loadJobs = useCallback(async () => {
    if (!supabase) {
      setJobs(FALLBACK_JOBS);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Failed to load jobs', error); return; }
    setJobs(data ?? []);
    setLoading(false);
  }, []);

  const loadCheckins = useCallback(async () => {
    if (!supabase) {
      setCheckins(FALLBACK_CHECKINS);
      setGpsStatus('verified');
      return;
    }

    const { data } = await supabase.from('clinical_checkins').select('*').order('created_at', { ascending: false });
    setCheckins(data ?? []);
    if (data && data.length > 0) setGpsStatus('verified');
  }, []);

  useEffect(() => { loadJobs(); loadCheckins(); }, [loadJobs, loadCheckins]);

  useEffect(() => {
    const saved = localStorage.getItem('ayush_recent_searches');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 8));
    } catch {
      localStorage.removeItem('ayush_recent_searches');
    }
  }, []);

  const pushRecentSearch = useCallback((value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      localStorage.setItem('ayush_recent_searches', JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setLiveSearchJobs([]);
      return;
    }

    const controller = new AbortController();
    setLiveSearchLoading(true);
    searchJobsLive(search, category, controller.signal)
      .then((results) => {
        if (!controller.signal.aborted) setLiveSearchJobs(results);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLiveSearchJobs(searchJobs(search, category, 4));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLiveSearchLoading(false);
      });

    return () => controller.abort();
  }, [search, category]);

  const dynamicSkillTags = useMemo(() => deriveSkillTags(search || 'Ayush healthcare jobs', category), [search, category]);
  const searchSuggestions = useMemo(() => {
    const query = search.trim();
    const pool = buildRecommendationSuggestions(query || 'AI/ML Engineer', category);

    if (!query) return [...new Set([...(pool || []), ...recentSearches, ...SEARCH_CHIPS])].slice(0, 8);

    const normalized = query.toLowerCase();
    return [...new Set([
      ...pool.filter((item) => {
        const term = item.toLowerCase();
        return term.includes(normalized) || normalized.includes(term) || term.split(/\s+/).some((part) => part.length > 2 && normalized.includes(part));
      }),
      ...dynamicSkillTags.filter((tag) => {
        const term = tag.toLowerCase();
        return term.includes(normalized) || normalized.includes(term) || term.split(/\s+/).some((part) => part.length > 2 && normalized.includes(part));
      }),
      ...recentSearches.filter((item) => item.toLowerCase().includes(normalized) || normalized.includes(item.toLowerCase())),
    ])].slice(0, 10);
  }, [search, category, dynamicSkillTags, recentSearches]);

  const closestSuggestion = useMemo(() => {
    const query = search.trim();
    if (!query) return '';

    const suggestions = [...searchSuggestions, ...dynamicSkillTags].filter((item) => item.toLowerCase() !== query.toLowerCase());
    if (!suggestions.length) return '';

    const normalizedQuery = query.toLowerCase();
    const bestMatch = suggestions.reduce((best, current) => {
      const currentText = current.toLowerCase();
      const currentSimilarity = currentText.includes(normalizedQuery) || normalizedQuery.includes(currentText)
        ? 6
        : Math.max(...currentText.split(/\s+/).map((part) => (normalizedQuery.includes(part) ? 3 : 0)));

      return currentSimilarity > best.score ? { value: current, score: currentSimilarity } : best;
    }, { value: suggestions[0], score: 0 });

    return bestMatch.score > 0 ? bestMatch.value : '';
  }, [search, dynamicSkillTags, searchSuggestions]);
  const searchedWebJobs = search.trim() ? liveSearchJobs : [];

  const filteredJobs = jobs.filter((job) => {
    const catMatch = category === 'All Skills' || job.category === category;
    if (!catMatch) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  const internalJobs = filteredJobs.filter((j) => j.source === 'employer');
  const externalJobs = search.trim() ? searchedWebJobs : filteredJobs.filter((j) => j.source !== 'employer');

  const normalizeSkillTerms = useCallback((value: string) => {
    return value
      .split(/[;,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/[^a-zA-Z0-9\s&+/.-]/g, ' '));
  }, []);

  const calculateFitScore = useCallback((job: SearchResultJob) => {
    const profileSkills = normalizeSkillTerms(skillsInput);
    const profileRole = targetRole.toLowerCase();
    const normalizedJobText = [job.title, job.company, job.description, ...(job.skills ?? [])].join(' ').toLowerCase();
    const profileTerms = new Set([
      ...profileSkills.flatMap((skill) => skill.toLowerCase().split(/\s+/).filter((part) => part.length > 2)),
      ...profileRole.split(/\s+/).filter((part) => part.length > 2),
    ]);

    if (!profileTerms.size) return 0;

    let hits = 0;
    for (const term of profileTerms) {
      if (normalizedJobText.includes(term)) hits += 1;
    }

    return Math.min(99, Math.max(10, Math.round((hits / profileTerms.size) * 100)));
  }, [normalizeSkillTerms, skillsInput, targetRole]);

  const handleFindMatchingJobs = useCallback(async () => {
    const cleanedRole = targetRole.trim() || 'Ayurvedic Medical Officer';
    const intent = (search || cleanedRole).trim() || cleanedRole;
    const cleanedSkills = normalizeSkillTerms(skillsInput);
    const experienceText = `${experienceValue || '1'} ${experienceUnit || 'Years'}`;
    const queryBits = [intent, ...cleanedSkills, experienceText, category === 'All Skills' ? 'jobs' : category];
    const query = queryBits.filter(Boolean).join(' ');

    setCandidateLoading(true);
    try {
      const results = await searchJobsLive(query, category);
      setCandidateJobs(results.length > 0 ? results : searchJobs(query, category, 5));
    } catch {
      setCandidateJobs(searchJobs(query, category, 5));
    } finally {
      setCandidateLoading(false);
    }
  }, [category, experienceUnit, experienceValue, normalizeSkillTerms, search, skillsInput, targetRole]);

  const handleApply = async (job: Job) => {
    if (!isAuthenticated) {
      onRequireAuth?.('Quick Apply');
      return;
    }

    const nextSkillMatchIndex = Math.min(99, skillMatchIndex + 2);
    setSkillMatchIndex(nextSkillMatchIndex);
    await persistMetrics(nextSkillMatchIndex, verifiedClinicalHours);
    setApplyingId(job.id);
    const fit = calculateAsqFit(job, nextSkillMatchIndex, verifiedClinicalHours);

    if (!supabase) {
      setApplyingId(null);
      setAppliedJobIds((prev) => new Set(prev).add(job.id));
      onToast(`Applied to ${job.title} at ${job.company}`, `Skill Match: ${fit}% — demo application saved`);
      return;
    }

    const { error } = await supabase.from('applications').insert({
      job_id: job.id, applicant_name: STUDENT.name, asq_fit: fit,
    });
    setApplyingId(null);
    if (error) { onToast('Application could not be submitted', 'Please try again'); return; }
    setAppliedJobIds((prev) => new Set(prev).add(job.id));
    onToast(`Applied to ${job.title} at ${job.company}`, `Skill Match: ${fit}% — application sent`);
  };

  const handleGpsCheckIn = () => {
    if (!isAuthenticated) {
      onRequireAuth?.('GPS Attendance Logger');
      return;
    }

    if (!supabase) {
      setGpsLoading(false);
      setGpsStatus('verified');
      const nextClinicalHours = verifiedClinicalHours + 4;
      const nextSkillIndex = Math.min(99, skillMatchIndex + 1);
      setVerifiedClinicalHours(nextClinicalHours);
      setSkillMatchIndex(nextSkillIndex);
      void persistMetrics(nextSkillIndex, nextClinicalHours);
      onToast('GPS Attendance Verified', '+4 practical hours added in demo mode');
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('error');
      onToast('Geolocation not supported', 'Your browser does not support GPS check-in');
      return;
    }
    setGpsLoading(true);
    setGpsStatus('verifying');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationName = 'Accredited Practical Training Centre';
        const { data, error } = await supabase
          .from('clinical_checkins')
          .insert({ location_name: locationName, latitude, longitude, hours_added: 4, verified: true })
          .select().single();
        setGpsLoading(false);
        if (error || !data) { setGpsStatus('error'); onToast('Check-in failed', 'Could not save attendance record'); return; }
        setCheckins((prev) => [data, ...prev]);
        setGpsStatus('verified');
        const nextClinicalHours = verifiedClinicalHours + 4;
        const nextSkillIndex = Math.min(99, skillMatchIndex + 1);
        setVerifiedClinicalHours(nextClinicalHours);
        setSkillMatchIndex(nextSkillIndex);
        await persistMetrics(nextSkillIndex, nextClinicalHours);
        onToast('GPS Attendance Verified', `+4 practical hours added at ${locationName}`);
      },
      () => { setGpsLoading(false); setGpsStatus('error'); onToast('GPS permission denied', 'Enable location access to verify attendance'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile Banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-lg shadow-emerald-900/20">
        <div className="relative px-6 py-7 sm:px-8">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{STUDENT.name}</h2>
                <p className="mt-1 text-sm text-emerald-100">{STUDENT.institution}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {STUDENT_SKILLS.slice(0, 6).map((skill) => (
                    <span key={skill} className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">{skill}</span>
                  ))}
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-emerald-100 backdrop-blur-sm">+{STUDENT_SKILLS.length - 6} more</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-100">Candidate Profile</p>
              <p className="mt-1 text-sm text-emerald-50">Dynamic role-to-job matching</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Search + Job Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Candidate Skill Profile</p>
                <h3 className="mt-1 text-xl font-bold text-slate-800">Find your best-matched jobs</h3>
              </div>
              <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Live match</div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Job interest / Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="AI/ML Engineer, React Developer, Clinical Research Associate..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <Search className="pointer-events-none absolute right-3 top-[44px] h-4 w-4 text-slate-400" />
                {search.trim() && searchSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    {searchSuggestions.slice(0, 6).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setSearch(suggestion);
                          setTargetRole(suggestion);
                          pushRecentSearch(suggestion);
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <span>{suggestion}</span>
                        <Search className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}
                {closestSuggestion && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Did you mean{' '}
                    <button type="button" className="font-semibold underline underline-offset-2" onClick={() => {
                      setSearch(closestSuggestion);
                      setTargetRole(closestSuggestion);
                      pushRecentSearch(closestSuggestion);
                    }}>
                      {closestSuggestion}
                    </button>
                    ?
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Target Job Title / Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Ayurvedic Medical Officer"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Key Skills</label>
                <textarea
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="Panchakarma, Clinical Diagnosis, Herbal Formulation"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Experience Duration</label>
                  <input
                    type="number"
                    min="0"
                    value={experienceValue}
                    onChange={(e) => setExperienceValue(e.target.value)}
                    placeholder="2"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit</label>
                  <select
                    value={experienceUnit}
                    onChange={(e) => setExperienceUnit(e.target.value as 'Days' | 'Months' | 'Years')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Days">Days</option>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleFindMatchingJobs}
                disabled={candidateLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {candidateLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Finding matches…</> : <><Search className="h-4 w-4" /> Find Matching Jobs</>}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-semibold text-slate-800">
              Matched Jobs <span className="ml-1 text-sm font-normal text-slate-400">({candidateJobs.length || filteredJobs.length})</span>
            </h3>
            <span className="text-xs text-slate-400">{candidateJobs.length > 0 ? 'Profile based results' : 'Fallback matches'}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : candidateJobs.length > 0 ? (
            <div className="space-y-3">
              {candidateJobs.map((job) => (
                <div key={job.id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-slate-800">{job.title}</h4>
                          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500"><Building2 className="h-3.5 w-3.5" /> {job.company}</p>
                        </div>
                        <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${sourceColors[job.source] ?? sourceColors.employer}`}>
                            {job.platform || job.source || 'Live Search'}
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${categoryColors[job.category] ?? ''}`}>{job.category}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                        <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> {job.stipend}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(job.skills ?? []).map((skill) => <span key={skill} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{skill}</span>)}
                      </div>

                      {job.description && <p className="mt-3 text-sm text-slate-500">{job.description}</p>}
                    </div>

                    <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
                      <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-2.5 ring-1 ring-emerald-100">
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700"><Zap className="h-3.5 w-3.5" /> Skill Fit</span>
                        <span className={`text-2xl font-bold ${calculateFitScore(job) >= 75 ? 'text-emerald-600' : calculateFitScore(job) >= 50 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {calculateFitScore(job)}%
                        </span>
                      </div>
                      {job.external_url ? (
                        <a href={job.external_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-xl border border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50 hover:shadow-sm">
                          <ExternalLink className="h-4 w-4" /> Apply
                        </a>
                      ) : (
                        <button disabled className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400">
                          <ExternalLink className="h-4 w-4" /> Apply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <p className="text-sm text-slate-500">No matches found. Try another role, skills, or experience profile.</p>
            </div>
          )}
        </div>

        {/* GPS Check-In Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50"><Navigation className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <h3 className="font-semibold text-slate-800">Candidate Summary</h3>
                <p className="text-xs text-slate-500">Profile based matching</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Role</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{targetRole || 'Not set'}</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="text-sm text-slate-600">Experience</span>
                  <span className="text-sm font-semibold text-slate-800">{experienceValue || '1'} {experienceUnit}</span>
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <span className="text-sm text-slate-600">Skills</span>
                  <span className="max-w-[55%] text-right text-xs font-medium text-slate-700">{skillsInput || 'No skills entered'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Verified hours</p>
                  <input
                    type="number"
                    min={0}
                    value={verifiedClinicalHours}
                    onChange={(e) => { void handleMetricChange('verifiedClinicalHours', Number(e.target.value || 0)); }}
                    className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xl font-bold text-emerald-800 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">Skill index</p>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={skillMatchIndex}
                    onChange={(e) => { void handleMetricChange('skillMatchIndex', Number(e.target.value || 0)); }}
                    className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xl font-bold text-blue-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800"><Clock className="h-4 w-4 text-emerald-600" /> Check-in History</h3>
            {checkins.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No check-ins yet.</p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {checkins.map((ci) => (
                  <div key={ci.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-medium text-slate-700">{ci.location_name}</p>
                        <p className="text-[11px] text-slate-400">{new Date(ci.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">+{ci.hours_added}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InternalJobCard({ job, fit, applied, applying, onApply }: {
  job: Job; fit: number; applied: boolean; applying: boolean; onApply: (job: Job) => void;
}) {
  return (
    <div className="group rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-800">{job.title}</h4>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500"><Building2 className="h-3.5 w-3.5" /> {job.company}</p>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${sourceColors.employer}`}>Direct from Employer</span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${categoryColors[job.category] ?? ''}`}>{job.category}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
            <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> {job.stipend}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.map((skill) => <span key={skill} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{skill}</span>)}
          </div>
          {job.description && <p className="mt-3 text-sm text-slate-500">{job.description}</p>}
        </div>
        <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
          <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-2.5 ring-1 ring-emerald-100">
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700"><Zap className="h-3.5 w-3.5" /> Skill Match</span>
            <span className={`text-2xl font-bold ${fit >= 75 ? 'text-emerald-600' : fit >= 50 ? 'text-amber-600' : 'text-slate-500'}`}>{fit}%</span>
          </div>
          <button onClick={() => onApply(job)} disabled={applying || applied}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              applied ? 'cursor-default bg-emerald-100 text-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/20'
            } disabled:opacity-70`}>
            {applying ? <><Loader2 className="h-4 w-4 animate-spin" /> Applying…</> : applied ? <><CheckCircle2 className="h-4 w-4" /> Applied</> : <><Zap className="h-4 w-4" /> Quick Apply</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExternalJobCard({ job, fit }: { job: SearchResultJob; fit: number }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-800">{job.title}</h4>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500"><Building2 className="h-3.5 w-3.5" /> {job.company}</p>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${sourceColors[job.source] ?? sourceColors.employer}`}>
                {job.platform}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${categoryColors[job.category] ?? ''}`}>{job.category}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
            <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> {job.stipend}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.map((skill) => <span key={skill} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{skill}</span>)}
          </div>
          {job.description && <p className="mt-3 text-sm text-slate-500">{job.description}</p>}
        </div>
        <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end">
          <div className="flex flex-col items-center rounded-xl bg-slate-50 px-4 py-2.5 ring-1 ring-slate-100">
            <span className="flex items-center gap-1 text-xs font-medium text-slate-600"><Zap className="h-3.5 w-3.5" /> Est. Match</span>
            <span className={`text-2xl font-bold ${fit >= 75 ? 'text-emerald-600' : fit >= 50 ? 'text-amber-600' : 'text-slate-500'}`}>{fit}%</span>
          </div>
          <a href={job.external_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50 hover:shadow-sm">
            <ExternalLink className="h-4 w-4" /> Apply on {job.platform}
          </a>
        </div>
      </div>
    </div>
  );
}
