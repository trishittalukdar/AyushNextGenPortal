import { useEffect, useState, useCallback } from 'react';
import {
  Plus, X, MapPin, Wallet, Briefcase, Loader2, TrendingUp, Link2,
} from 'lucide-react';
import { supabase, FALLBACK_CANDIDATES, FALLBACK_JOBS, type Job, type Candidate } from '@/lib/supabase';
import { SKILL_CATEGORIES, SKILL_SUGGESTIONS, JOB_CATEGORIES } from '@/lib/skills';
import { useAuth } from '@/context/AuthContext';

type Props = {
  onToast: (message: string, submessage?: string) => void;
  refreshKey: number;
  onJobPosted: () => void;
  onRequireAuth?: (feature: string) => void;
};

const categoryColors: Record<string, string> = {
  'Tech/Software': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border dark:border-indigo-800',
  'Healthcare & Ayush': 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 dark:border dark:border-teal-800',
  'Core Engineering': 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 dark:border dark:border-orange-800',
  'Business & Finance': 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:border dark:border-rose-800',
  'Government & Public': 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700',
};

export function EmployerPortal({ onToast, refreshKey, onJobPosted, onRequireAuth }: Props) {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Healthcare & Ayush');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [stipend, setStipend] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!supabase) {
      setJobs(FALLBACK_JOBS.filter((job) => job.source === 'employer'));
      setCandidates(FALLBACK_CANDIDATES);
      setLoading(false);
      return;
    }

    const [jobsRes, candRes] = await Promise.all([
      supabase.from('jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('candidates').select('*').order('asq_score', { ascending: false }),
    ]);
    setJobs(jobsRes.data ?? []);
    setCandidates(candRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => setSkills((prev) => prev.filter((s) => s !== skill));

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (skillInput.trim()) addSkill(skillInput); }
  };

  const resetForm = () => {
    setTitle(''); setCategory('Healthcare & Ayush'); setCompany(''); setLocation('');
    setStipend(''); setApplicationUrl(''); setDescription(''); setSkills([]); setSkillInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth?.('Job Posting');
      return;
    }

    if (!title.trim() || !company.trim() || !location.trim() || !stipend.trim()) {
      onToast('Please fill all required fields', 'Title, company, location, and stipend are needed');
      return;
    }
    setSubmitting(true);

    if (!supabase) {
      setSubmitting(false);
      onToast('Demo job saved locally', `${title} at ${company} was added to the demo feed`);
      resetForm(); setShowForm(false); onJobPosted();
      return;
    }

    const { error } = await supabase.from('jobs').insert({
      title: title.trim(), category, company: company.trim(), location: location.trim(),
      stipend: stipend.trim(), skills: skills.length > 0 ? skills : ['General'],
      description: description.trim(), source: 'employer',
      external_url: applicationUrl.trim() || null,
    });
    setSubmitting(false);
    if (error) { onToast('Could not publish job', 'Please try again'); return; }
    onToast('Job published successfully', `${title} at ${company} added to the feed`);
    resetForm(); setShowForm(false); loadData(); onJobPosted();
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (b.asq_score !== a.asq_score) return b.asq_score - a.asq_score;
    return b.clinical_hours - a.clinical_hours;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Industry Employer Portal</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Post jobs across all sectors and discover ranked candidates</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/20">
          {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Post New Job</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
            <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Publish Job / Internship
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job Title" required>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend React Developer" className={inputClass} />
            </Field>
            <Field label="Category" required>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                {JOB_CATEGORIES.filter((c) => c !== 'All Fields').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </Field>
            <Field label="Company Name" required>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Razorpay" className={inputClass} />
            </Field>
            <Field label="Location" required>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru, KA" className={inputClass} />
            </Field>
            <Field label="Salary / Stipend" required>
              <input value={stipend} onChange={(e) => setStipend(e.target.value)} placeholder="e.g. ₹45,000/mo" className={inputClass} />
            </Field>
            <Field label="Application URL">
              <input value={applicationUrl} onChange={(e) => setApplicationUrl(e.target.value)} placeholder="e.g. https://careers.company.com/apply/123" className={inputClass} />
            </Field>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Required Skills</label>
            <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:bg-slate-800">
              {skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="text-emerald-500 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"><X className="h-3 w-3" /></button>
                </span>
              ))}
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={handleSkillKeyDown}
                placeholder={skills.length === 0 ? 'Type a skill and press Enter…' : 'Add more…'}
                className="flex-1 bg-transparent py-1 text-sm text-slate-800 placeholder-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder-slate-500" />
            </div>
            <div className="mt-3 space-y-2">
              {showAllSkills ? (
                SKILL_CATEGORIES.map((cat) => (
                  <div key={cat.name}>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{cat.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.filter((s) => !skills.includes(s)).map((s) => (
                        <button key={s} type="button" onClick={() => addSkill(s)} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:bg-slate-800 dark:hover:text-emerald-300">+ {s}</button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).slice(0, 14).map((s) => (
                    <button key={s} type="button" onClick={() => addSkill(s)} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-slate-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:bg-slate-800 dark:hover:text-emerald-300">+ {s}</button>
                  ))}
                  <button type="button" onClick={() => setShowAllSkills(true)} className="rounded-full border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-slate-800">Show all categories</button>
                </div>
              )}
              {showAllSkills && <button type="button" onClick={() => setShowAllSkills(false)} className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">Show fewer</button>}
            </div>
          </div>

          <div className="mt-4">
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the role and responsibilities…" className={`${inputClass} resize-none`} />
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-70">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</> : <><Plus className="h-4 w-4" /> Publish to Feed</>}
            </button>
          </div>
        </form>
      )}

      {/* Posted Jobs */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Your Posted Jobs
          <span className="text-sm font-normal text-slate-400 dark:text-slate-500">({jobs.filter((j) => j.source === 'employer').length})</span>
        </h3>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {jobs.filter((j) => j.source === 'employer').map((job) => (
              <div key={job.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">{job.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[job.category] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{job.category}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                  <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> {job.stipend}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {job.skills.map((s) => <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{s}</span>)}
                </div>
                {job.external_url && <p className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400"><Link2 className="h-3 w-3" /> Application URL set</p>}
              </div>
            ))}
            {jobs.filter((j) => j.source === 'employer').length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
                No jobs posted yet. Click "Post New Job" to get started.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Candidate Ranking Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Applicant Ranking Table</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sorted by Skill Match %, practical hours, and status</p>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-emerald-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">Rank</th>
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-5 py-3 font-medium">Institution</th>
                  <th className="px-5 py-3 font-medium">Match %</th>
                  <th className="px-5 py-3 font-medium">Practical Hrs</th>
                  <th className="px-5 py-3 font-medium">Top Skills</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {sortedCandidates.map((c, idx) => (
                  <tr key={c.id} className="transition-colors hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20">
                    <td className="px-5 py-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : idx < 3 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>{idx + 1}</span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">{c.name}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{c.institution}</td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{c.asq_score}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">/100</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{c.clinical_hours}h</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0, 3).map((s) => <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{s}</span>)}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' :
                        c.status === 'Shortlisted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:bg-slate-800';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}{required && <span className="text-emerald-600 dark:text-emerald-400"> *</span>}
      </label>
      {children}
    </div>
  );
}
