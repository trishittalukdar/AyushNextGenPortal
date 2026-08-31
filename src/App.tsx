import { useCallback, useEffect, useState } from 'react';
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
  ShieldCheck,
} from 'lucide-react';
import { StudentHub } from './components/StudentHub';
import { EmployerPortal } from './components/EmployerPortal';
import { MinistryDashboard } from './components/MinistryDashboard';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { SettingsPage } from './components/SettingsPage';
import { useAuth } from './context/AuthContext';

type Tab = 'student' | 'employer' | 'ministry';

const tabs: { id: Tab; label: string; icon: typeof GraduationCap; desc: string }[] = [
  { id: 'student', label: 'Student Hub', icon: GraduationCap, desc: 'Search & apply' },
  { id: 'employer', label: 'Industry Portal', icon: Briefcase, desc: 'Post & rank' },
  { id: 'ministry', label: 'Ministry Analytics', icon: BarChart3, desc: 'National view' },
];

function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('student');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const isSettingsRoute = pathname === '/settings' || pathname === '/settings/';

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setPathname(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
                const active = !isSettingsRoute && activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      navigate('/');
                      setActiveTab(tab.id);
                    }}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                      active ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
              <button
                onClick={() => navigate('/settings')}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                  isSettingsRoute ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </nav>

            <div className="flex items-center gap-2">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
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
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.fullName || (user?.email ? user.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'User')}</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">ASQ {user?.asqScore ?? 88}/100</p>
                  </div>
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
              const active = !isSettingsRoute && activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                    onClick={() => {
                      navigate('/');
                      setActiveTab(tab.id);
                    }}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-all ${
                    active ? 'bg-emerald-50 text-emerald-700 dark:bg-slate-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={() => navigate('/settings')}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-all ${isSettingsRoute ? 'bg-emerald-50 text-emerald-700 dark:bg-slate-800 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {isAuthenticated && !isSettingsRoute && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">My Account</p>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{user?.fullName || (user?.email ? user.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'User')}</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {user?.status ?? 'Student'}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Headline</p>
                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{user?.headline ?? 'Career-focused learner'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Location</p>
                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{user?.location ?? 'India'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Availability</p>
                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">{user?.availability ?? 'Open to opportunities'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Skills</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(user?.skills ?? []).slice(0, 6).map((skill) => (
                    <span key={skill} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Skill Match Index</p>
                <p className="mt-2 text-xl font-bold text-blue-800 dark:text-blue-400">{user?.skillMatchIndex ?? 88}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Verified Clinical Hours</p>
                <p className="mt-2 text-xl font-bold text-emerald-800 dark:text-emerald-400">{user?.verifiedClinicalHours ?? 34}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">About</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{user?.bio ?? 'Career-focused professional building a stronger profile.'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Education</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{user?.education ?? 'Education details not added yet'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Portfolio</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{user?.portfolio ?? 'https://example.com/portfolio'}</p>
              </div>
            </div>
          </section>
        )}

        {isSettingsRoute ? (
          <SettingsPage theme={theme} setTheme={setTheme} onToast={addToast} />
        ) : activeTab === 'student' && (
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

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
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
