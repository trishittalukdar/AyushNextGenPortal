import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  BarChart3,
  Leaf,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Settings,
  Save,
  Moon,
  SunMedium,
  Palette,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { StudentHub } from './components/StudentHub';
import { EmployerPortal } from './components/EmployerPortal';
import { MinistryDashboard } from './components/MinistryDashboard';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';

type Tab = 'student' | 'employer' | 'ministry';

const tabs: { id: Tab; label: string; icon: typeof GraduationCap; desc: string }[] = [
  { id: 'student', label: 'Student Hub', icon: GraduationCap, desc: 'Search & apply' },
  { id: 'employer', label: 'Industry Portal', icon: Briefcase, desc: 'Post & rank' },
  { id: 'ministry', label: 'Ministry Analytics', icon: BarChart3, desc: 'National view' },
];

function App() {
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('student');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [profileDraft, setProfileDraft] = useState(() => ({
    fullName: user?.fullName ?? '',
    status: user?.status ?? '',
    specialty: user?.specialty ?? '',
    institution: user?.institution ?? '',
    location: user?.location ?? '',
    headline: user?.headline ?? '',
    bio: user?.bio ?? '',
    education: user?.education ?? '',
    experience: user?.experience ?? '',
    portfolio: user?.portfolio ?? '',
    availability: user?.availability ?? '',
    skills: user?.skills ?? [],
    skillMatchIndex: user?.skillMatchIndex ?? 0,
    verifiedClinicalHours: user?.verifiedClinicalHours ?? 0,
  }));

  const addToast = useCallback((message: string, submessage?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, submessage }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleJobPosted = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleRequireAuth = useCallback((feature: string) => {
    setAuthMode('login');
    setAuthModalOpen(true);
    addToast(`Please log in to use ${feature}`, 'Authentication is required for this action.');
  }, [addToast]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('ayush-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('ayush-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!user) return;
    setProfileDraft({
      fullName: user.fullName,
      status: user.status,
      specialty: user.specialty,
      institution: user.institution,
      location: user.location,
      headline: user.headline,
      bio: user.bio,
      education: user.education,
      experience: user.experience,
      portfolio: user.portfolio,
      availability: user.availability,
      skills: user.skills,
      skillMatchIndex: user.skillMatchIndex,
      verifiedClinicalHours: user.verifiedClinicalHours,
    });
  }, [user]);

  const isProfileComplete = useCallback((candidate: typeof user) => {
    if (!candidate) return false;
    return Boolean(
      candidate.fullName?.trim() &&
      candidate.email?.trim() &&
      candidate.status &&
      candidate.specialty?.trim() &&
      candidate.institution?.trim() &&
      candidate.skills?.length
    );
  }, []);

  useEffect(() => {
    if (user && !isProfileComplete(user)) {
      setProfileEditorOpen(true);
    }
  }, [isProfileComplete, user]);

  const handleProfileSave = useCallback(async () => {
    if (!user) return;
    await updateProfile({
      fullName: profileDraft.fullName,
      status: profileDraft.status,
      specialty: profileDraft.specialty,
      institution: profileDraft.institution,
      location: profileDraft.location,
      headline: profileDraft.headline,
      bio: profileDraft.bio,
      education: profileDraft.education,
      experience: profileDraft.experience,
      portfolio: profileDraft.portfolio,
      availability: profileDraft.availability,
      skills: profileDraft.skills,
      skillMatchIndex: profileDraft.skillMatchIndex,
      verifiedClinicalHours: profileDraft.verifiedClinicalHours,
    });
    addToast('Profile updated', 'Your account details have been saved.');
    setProfileEditorOpen(false);
  }, [addToast, profileDraft, updateProfile, user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-600/20">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight text-slate-800 dark:text-slate-100">Ayush NextGen Portal</h1>
                <p className="text-[11px] leading-tight text-slate-400">Ministry of Ayush · SIH26044</p>
              </div>
            </div>

            <nav className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                      active ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.fullName ?? 'Trishit Talukdar'}</p>
                    <p className="text-[11px] text-emerald-700">ASQ {user?.asqScore ?? 88}/100</p>
                  </div>
                  <button
                    onClick={() => setSettingsOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                    aria-label="Open account settings"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Settings
                  </button>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <nav className="flex sm:hidden items-center gap-1 pb-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-all ${
                    active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {isAuthenticated && settingsOpen && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Settings</p>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Account settings</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <UserCog className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Account details</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Update your personal profile</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setProfileEditorOpen(true);
                    setSettingsOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Settings className="h-4 w-4" />
                  Account settings
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Appearance</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Switch theme</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      theme === 'light'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
                    }`}
                  >
                    <SunMedium className="h-4 w-4" /> Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      theme === 'dark'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
                    }`}
                  >
                    <Moon className="h-4 w-4" /> Dark
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {isAuthenticated && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">My Account</p>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{user?.fullName}</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {user?.status ?? 'Student'}
                </span>
                <button
                  onClick={() => {
                    setSettingsOpen(true);
                    setProfileEditorOpen(false);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Settings
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Headline</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{user?.headline ?? 'Career-focused learner'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{user?.location ?? 'India'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Availability</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{user?.availability ?? 'Open to opportunities'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Skills</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(user?.skills ?? []).slice(0, 6).map((skill) => (
                    <span key={skill} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Skill Match Index</p>
                <p className="mt-2 text-xl font-bold text-blue-800">{user?.skillMatchIndex ?? 88}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Verified Clinical Hours</p>
                <p className="mt-2 text-xl font-bold text-emerald-800">{user?.verifiedClinicalHours ?? 34}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">About</p>
                <p className="mt-2 text-sm text-slate-600">{user?.bio ?? 'Career-focused professional building a stronger profile.'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Education</p>
                <p className="mt-2 text-sm text-slate-600">{user?.education ?? 'Education details not added yet'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Portfolio</p>
                <p className="mt-2 text-sm text-slate-600">{user?.portfolio ?? 'https://example.com/portfolio'}</p>
              </div>
            </div>
          </section>
        )}

        {isAuthenticated && profileEditorOpen && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Account settings</p>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Edit your profile</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProfileEditorOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileSave}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4" /> Save changes
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Full name</span>
                <input
                  value={profileDraft.fullName}
                  placeholder="Your full name"
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Status</span>
                <select
                  value={profileDraft.status}
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, status: e.target.value as typeof prev.status }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">Select your status</option>
                  <option value="Student">Student</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Working Professional">Working Professional</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Career Break">Career Break</option>
                </select>
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Headline</span>
                <input value={profileDraft.headline} placeholder="e.g. AI-ready healthcare professional" onChange={(e) => setProfileDraft((prev) => ({ ...prev, headline: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Location</span>
                <input value={profileDraft.location} placeholder="Your city or country" onChange={(e) => setProfileDraft((prev) => ({ ...prev, location: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" />
              </label>

              <label className="block text-sm text-slate-700 md:col-span-2">
                <span className="mb-1.5 block font-medium">Bio</span>
                <textarea value={profileDraft.bio} placeholder="Tell people about your background, interests, and goals" onChange={(e) => setProfileDraft((prev) => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Specialty</span>
                <input value={profileDraft.specialty} placeholder="Ayurveda, data science, product, etc." onChange={(e) => setProfileDraft((prev) => ({ ...prev, specialty: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Institution</span>
                <input value={profileDraft.institution} placeholder="College, company, or organization" onChange={(e) => setProfileDraft((prev) => ({ ...prev, institution: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Education</span>
                <input value={profileDraft.education} placeholder="Degree, course, or certification" onChange={(e) => setProfileDraft((prev) => ({ ...prev, education: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Experience</span>
                <input value={profileDraft.experience} placeholder="Internships, roles, or projects" onChange={(e) => setProfileDraft((prev) => ({ ...prev, experience: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Portfolio / LinkedIn</span>
                <input value={profileDraft.portfolio} placeholder="https://linkedin.com/in/your-profile" onChange={(e) => setProfileDraft((prev) => ({ ...prev, portfolio: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Availability</span>
                <input value={profileDraft.availability} placeholder="Open to internships, freelance, full-time" onChange={(e) => setProfileDraft((prev) => ({ ...prev, availability: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Skill Match Index</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={profileDraft.skillMatchIndex}
                  placeholder="0"
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, skillMatchIndex: Math.min(100, Math.max(0, Number(e.target.value || 0))) }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1.5 block font-medium">Verified Clinical Hours</span>
                <input
                  type="number"
                  min={0}
                  value={profileDraft.verifiedClinicalHours}
                  placeholder="0"
                  onChange={(e) => setProfileDraft((prev) => ({ ...prev, verifiedClinicalHours: Math.max(0, Number(e.target.value || 0)) }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium text-slate-700">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {profileDraft.skills.length ? profileDraft.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{skill}</span>
                  )) : (
                    <span className="rounded-full border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-400">Add your skills</span>
                  )}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {SKILL_CATALOG.flatMap((group) => group.skills).slice(0, 18).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => setProfileDraft((prev) => {
                        const nextSkills = prev.skills.includes(skill)
                          ? prev.skills.filter((item) => item !== skill)
                          : [...prev.skills, skill];
                        return { ...prev, skills: nextSkills };
                      })}
                      className={`rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                        profileDraft.skills.includes(skill)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'student' && (
          <StudentHub
            onToast={addToast}
            onRequireAuth={handleRequireAuth}
          />
        )}
        {activeTab === 'employer' && (
          <EmployerPortal
            onToast={addToast}
            refreshKey={refreshKey}
            onJobPosted={handleJobPosted}
            onRequireAuth={handleRequireAuth}
          />
        )}
        {activeTab === 'ministry' && <MinistryDashboard refreshKey={refreshKey} />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <p className="text-center text-xs text-slate-400">
            Ayush NextGen Portal · A prototype for the Ministry of Ayush bridging academia and industry
          </p>
        </div>
      </footer>

      <AuthModal
        open={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onToast={addToast}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
