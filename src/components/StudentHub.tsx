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
import { JOB_CATEGORIES, type JobCategory } from '@/lib/skills';
import { searchJobs, searchJobsLive, deriveSkillTags, type SearchResultJob } from '@/services/jobSearchService';
import { useAuth } from '@/context/AuthContext';

type Props = {
  onToast: (message: string, submessage?: string) => void;
  clinicalHours: number;
  skillMatchIndex: number;
  onClinicalHoursChange: (hours: number) => void;
  onClinicalHoursIncrease: (hours: number) => void;
  onSkillMatchIndexChange: (score: number) => void;
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

export function StudentHub({ onToast, clinicalHours, skillMatchIndex, onClinicalHoursChange, onClinicalHoursIncrease, onSkillMatchIndexChange, onRequireAuth }: Props) {
  const { isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All Skills');
  const [loading, setLoading] = useState(true);
  const [liveSearchJobs, setLiveSearchJobs] = useState<SearchResultJob[]>([]);
  const [liveSearchLoading, setLiveSearchLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>('idle');

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

  const handleApply = async (job: Job) => {
    if (!isAuthenticated) {
      onRequireAuth?.('Quick Apply');
      return;
    }

    setApplyingId(job.id);
    const fit = calculateAsqFit(job, skillMatchIndex, clinicalHours);

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
      onClinicalHoursIncrease(4);
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
        onClinicalHoursIncrease(4);
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
            <div className="flex gap-4 sm:gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-emerald-100">
                  <Award className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-wide">Skill Index</span>
                </div>
                <p className="mt-1 text-3xl font-bold text-white">{skillMatchIndex}<span className="text-lg text-emerald-200">/100</span></p>
                <input aria-label="Skill Match Index" type="range" min="0" max="100" value={skillMatchIndex}
                  onChange={(e) => onSkillMatchIndexChange(Number(e.target.value))}
                  className="mt-2 w-28 accent-white" />
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-emerald-100">
                  <Clock className="h-4 w-4" /><span className="text-xs font-medium uppercase tracking-wide">Practical Hrs</span>
                </div>
                <p className="mt-1 text-3xl font-bold text-white">{clinicalHours}<span className="text-lg text-emerald-200"> hrs</span></p>
                <input aria-label="Verified Clinical Hours" type="range" min="0" max="500" step="5" value={clinicalHours}
                  onChange={(e) => onClinicalHoursChange(Number(e.target.value))}
                  className="mt-2 w-28 accent-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Search + Job Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Universal Search Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search any skill or job title — React, HPLC, UX Design, Machine Learning…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="h-4 w-4 flex-shrink-0 text-slate-400" />
              {['All Skills', 'AYUSH & Medicine', 'Software & AI', 'Core Engineering', 'Clinical Research', 'Government'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                    category === cat
                      ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {dynamicSkillTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearch(tag)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-500 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-semibold text-slate-800">
              Search Results <span className="ml-1 text-sm font-normal text-slate-400">({filteredJobs.length})</span>
            </h3>
            <span className="text-xs text-slate-400">{internalJobs.length} internal · {externalJobs.length} external</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <p className="text-sm text-slate-500">No opportunities match your search. Try a different skill or category.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Internal Feed Section */}
              {internalJobs.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-1">
                    <Briefcase className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-700">Internal Verified Listings</span>
                    <span className="text-xs text-slate-400">({internalJobs.length})</span>
                  </div>
                  {internalJobs.map((job) => <InternalJobCard key={job.id} job={job} fit={calculateAsqFit(job, skillMatchIndex, clinicalHours)} applied={appliedJobIds.has(job.id)} applying={applyingId === job.id} onApply={handleApply} />)}
                </>
              )}

              {externalJobs.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-3">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-700">Universal Web Skimmer · {liveSearchLoading ? 'Searching RapidAPI…' : 'Live Search Results'}</span>
                    <span className="text-xs text-slate-400">({externalJobs.length})</span>
                  </div>
                  {externalJobs.map((job) => <ExternalJobCard key={job.id} job={job as SearchResultJob} fit={calculateAsqFit(job as Job, skillMatchIndex, clinicalHours)} />)}
                </>
              )}
            </div>
          )}
        </div>

        {/* GPS Check-In Panel */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50"><Navigation className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <h3 className="font-semibold text-slate-800">GPS Practical Hours Logger</h3>
                <p className="text-xs text-slate-500">Verify on-site attendance</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Current Status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  gpsStatus === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                  gpsStatus === 'verifying' ? 'bg-amber-100 text-amber-700' :
                  gpsStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {gpsStatus === 'verified' ? 'Verified at Accredited Center' : gpsStatus === 'verifying' ? 'Verifying…' : gpsStatus === 'error' ? 'Verification Failed' : 'Not Checked In'}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-800">{clinicalHours}</span>
                <span className="text-sm text-slate-500">total practical hours</span>
              </div>
            </div>
            <button onClick={handleGpsCheckIn} disabled={gpsLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/20 disabled:opacity-70">
              {gpsLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying GPS…</> : <><Navigation className="h-4 w-4" /> Verify GPS Attendance</>}
            </button>
            <p className="mt-2 text-center text-xs text-slate-400">Each verified check-in adds +4 practical hours</p>
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
