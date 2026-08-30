import { useEffect, useState, useCallback } from 'react';
import {
  Briefcase, Send, Clock, TrendingUp, BarChart3, AlertTriangle, Globe2, Layers,
} from 'lucide-react';
import { supabase, FALLBACK_JOBS } from '@/lib/supabase';

type Props = { refreshKey: number };

const macroStats = [
  { label: 'Total Active Listings', value: '12,400+', icon: Briefcase, sub: 'Across all platforms & sectors' },
  { label: 'Direct Applications Processed', value: '8,920', icon: Send, sub: 'Via platform Quick Apply' },
  { label: 'Verified Hours Logged', value: '1.28M hrs', icon: Clock, sub: 'GPS-verified practical hours' },
  { label: 'Sector Match Rate', value: '74.2%', icon: TrendingUp, sub: 'Skill-to-role alignment rate' },
];

const sectorDeficits = [
  { sector: 'Software / Tech', skill: 'AI / ML Engineering', deficit: 48, zone: 'Pan-India' },
  { sector: 'Software / Tech', skill: 'DevOps & Cloud (Kubernetes)', deficit: 35, zone: 'Bengaluru, Hyderabad' },
  { sector: 'Healthcare & Ayush', skill: 'HPLC & Analytical Chemistry', deficit: 42, zone: 'Western Zone' },
  { sector: 'Healthcare & Ayush', skill: 'GCP / NABH Clinical Research', deficit: 28, zone: 'Southern Zone' },
  { sector: 'Pharma Manufacturing', skill: 'Quality Control (GMP)', deficit: 31, zone: 'Pan-India' },
  { sector: 'Healthcare & Ayush', skill: 'Pharmacovigilance & ICSR', deficit: 35, zone: 'Northern Zone' },
  { sector: 'Core Engineering', skill: 'Mechanical Design (SolidWorks)', deficit: 26, zone: 'Pune, Chennai' },
  { sector: 'Core Engineering', skill: 'PLC / SCADA Automation', deficit: 39, zone: 'Mumbai, Ahmedabad' },
  { sector: 'Business & Finance', skill: 'Financial Modeling & Valuation', deficit: 22, zone: 'Mumbai, Delhi' },
  { sector: 'Business & Finance', skill: 'Digital Marketing & Analytics', deficit: 33, zone: 'Pan-India' },
  { sector: 'Government & Public', skill: 'Public Health & Epidemiology', deficit: 41, zone: 'Pan-India' },
  { sector: 'Government & Public', skill: 'Defense R&D (Signal Processing)', deficit: 53, zone: 'Hyderabad, Delhi' },
  { sector: 'Healthcare & Ayush', skill: 'Panchakarma & Ayurveda', deficit: 51, zone: 'Eastern Zone' },
  { sector: 'Healthcare & Ayush', skill: 'Yoga Therapy & Naturopathy', deficit: 38, zone: 'North-Eastern Zone' },
  { sector: 'Healthcare & Ayush', skill: 'Telemedicine & Health Informatics', deficit: 47, zone: 'National Avg' },
];

const sectorColors: Record<string, string> = {
  'Software / Tech': 'bg-indigo-500',
  'Healthcare & Ayush': 'bg-teal-500',
  'Pharma Manufacturing': 'bg-emerald-500',
  'Core Engineering': 'bg-orange-500',
  'Business & Finance': 'bg-rose-500',
  'Government & Public': 'bg-slate-600',
};

const sectorBadges: Record<string, string> = {
  'Software / Tech': 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
  'Healthcare & Ayush': 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
  'Pharma Manufacturing': 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  'Core Engineering': 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
  'Business & Finance': 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
  'Government & Public': 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export function MinistryDashboard({ refreshKey }: Props) {
  const [jobCount, setJobCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  const loadStats = useCallback(async () => {
    if (!supabase) {
      const counts: Record<string, number> = {};
      FALLBACK_JOBS.forEach((job) => {
        counts[job.category] = (counts[job.category] ?? 0) + 1;
      });
      setJobCount(FALLBACK_JOBS.length);
      setCategoryCounts(counts);
      return;
    }

    const { count } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
    setJobCount(count ?? 0);
    const { data } = await supabase.from('jobs').select('category');
    const counts: Record<string, number> = {};
    (data ?? []).forEach((row: { category: string }) => {
      counts[row.category] = (counts[row.category] ?? 0) + 1;
    });
    setCategoryCounts(counts);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats, refreshKey]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Ministry & Sector Analytics Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Multi-industry overview of the national job ecosystem</p>
      </div>

      {/* Macro Analytics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {macroStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-950/20" />
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:ring-emerald-900/40">
                  <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
                <p className="mt-0.5 text-sm font-medium text-slate-600 dark:text-slate-300">{stat.label}</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Feed Stats by Category */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 lg:col-span-1 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-teal-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 dark:bg-emerald-500"><BarChart3 className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">Active Opportunities in Feed</p>
              <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{jobCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Listings by Sector</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/80">
                <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${sectorBadges[cat] ?? ''}`}>{cat}</span>
                <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Skill Deficit & Demand Map */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Regional Skill Deficit & Demand Map</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Skill gaps across sectors to guide national policy and curriculum updates</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {sectorDeficits.map((r, idx) => (
            <div key={idx} className="group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${sectorBadges[r.sector] ?? ''}`}>{r.sector}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{r.skill}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">({r.zone})</span>
                </div>
                <span className={`flex items-center gap-1 text-sm font-bold ${r.deficit >= 40 ? 'text-red-600 dark:text-red-400' : r.deficit >= 25 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {r.deficit >= 40 && <AlertTriangle className="h-3.5 w-3.5" />}
                  {r.deficit}% deficit
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full rounded-full transition-all duration-500 ${sectorColors[r.sector] ?? 'bg-slate-500'}`} style={{ width: `${r.deficit}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low (under 25%)</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Moderate (25–39%)</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical (40%+)</span>
        </div>
      </div>
    </div>
  );
}
