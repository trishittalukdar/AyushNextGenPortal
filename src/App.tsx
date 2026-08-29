import { useCallback, useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  BarChart3,
  Leaf,
  LogIn,
  UserPlus,
  LogOut,
  User,
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

const readStoredMetric = (key: string, fallback: number, max: number) => {
  const stored = localStorage.getItem(key);
  const value = stored === null ? Number.NaN : Number(stored);
  return Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : fallback;
};

function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('student');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [clinicalHours, setClinicalHours] = useState(() => readStoredMetric('user_clinical_hours', 140, 500));
  const [skillMatchIndex, setSkillMatchIndex] = useState(() => readStoredMetric('user_skill_score', 88, 100));
  const [refreshKey, setRefreshKey] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

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

  const updateClinicalHours = useCallback((hours: number) => {
    setClinicalHours(hours);
    localStorage.setItem('user_clinical_hours', String(hours));
  }, []);

  const updateSkillMatchIndex = useCallback((score: number) => {
    setSkillMatchIndex(score);
    localStorage.setItem('user_skill_score', String(score));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-600/20">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight text-slate-800">Ayush NextGen Portal</h1>
                <p className="text-[11px] leading-tight text-slate-400">Ministry of Ayush · SIH26044</p>
              </div>
            </div>

            <nav className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                      active ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-slate-800">{user?.fullName ?? 'Trishit Talukdar'}</p>
                    <p className="text-[11px] text-emerald-700">ASQ {user?.asqScore ?? 88}/100</p>
                  </div>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
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
        {activeTab === 'student' && (
          <StudentHub
            onToast={addToast}
            clinicalHours={clinicalHours}
            skillMatchIndex={skillMatchIndex}
            onClinicalHoursChange={updateClinicalHours}
            onClinicalHoursIncrease={(h) => updateClinicalHours(Math.min(500, clinicalHours + h))}
            onSkillMatchIndexChange={updateSkillMatchIndex}
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
