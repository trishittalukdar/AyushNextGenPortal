import { useMemo, useState } from 'react';
import { Github, Globe, Lock, LogIn, Mail, Shield, UserPlus, X } from 'lucide-react';
import { useAuth, type AuthRole, type UserStatus } from '@/context/AuthContext';
import { hasSupabaseConfig } from '@/lib/supabase';

type AuthModalProps = {
  open: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onToast: (message: string, submessage?: string) => void;
};

const roleOptions: { value: AuthRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'employer', label: 'Employer' },
  { value: 'ministry', label: 'Ministry' },
];

export function AuthModal({ open, initialMode = 'login', onClose, onToast }: AuthModalProps) {
  const { user, login, loginWithProvider, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [role, setRole] = useState<AuthRole>('student');
  const [status, setStatus] = useState<UserStatus>('Student');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState(user?.password ?? '');
  const [specialty, setSpecialty] = useState(user?.specialty ?? '');
  const [institution, setInstitution] = useState(user?.institution ?? '');
  const [headline, setHeadline] = useState(user?.headline ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [education, setEducation] = useState(user?.education ?? '');
  const [experience, setExperience] = useState(user?.experience ?? '');
  const [portfolio, setPortfolio] = useState(user?.portfolio ?? '');
  const [availability, setAvailability] = useState(user?.availability ?? '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(user?.skills ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isLogin = mode === 'login';

  useMemo(() => {
    setMode(initialMode);
    if (user) {
      setRole(user.role);
      setStatus(user.status);
      setFullName(user.fullName);
      setEmail(user.email);
      setPassword(user.password);
      setSpecialty(user.specialty);
      setInstitution(user.institution);
      setHeadline(user.headline);
      setLocation(user.location);
      setBio(user.bio);
      setEducation(user.education);
      setExperience(user.experience);
      setPortfolio(user.portfolio);
      setAvailability(user.availability);
      setSelectedSkills(user.skills);
    }
  }, [initialMode, user]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (isLogin) {
      if (!email.trim() || !password.trim()) {
        setError('Please enter your email and password.');
        return;
      }

      try {
        setSubmitting(true);
        await login({ email, password, role });
        onToast('Welcome back', 'You are now signed in.');
        onClose();
      } catch (loginError) {
        setError(loginError instanceof Error ? loginError.message : 'Unable to log in.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please enter your name, email, and a password. You can complete the rest of your profile in Settings.');
      return;
    }

    try {
      setSubmitting(true);
      await signup({ fullName, email, password, role, status, specialty, institution, skills: selectedSkills, headline, location, bio, education, experience, portfolio, availability });
      onToast('Account created', 'Your profile has been saved.');
      onClose();
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setSubmitting(true);
      setError('');

      if (hasSupabaseConfig) {
        const trimmedEmail = email.trim();
        const user = await loginWithProvider(provider, { fullName: fullName || undefined, email: trimmedEmail, role });
        onToast(`Signed in with ${provider === 'google' ? 'Google' : 'GitHub'}`, `Redirecting to ${provider === 'google' ? 'Google' : 'GitHub'}...`);
        if (user?.email) {
          // The redirect flow will take control; no local close needed here.
        }
        return;
      }

      const trimmedEmail = email.trim();
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
      if (!trimmedEmail || !emailValid) {
        setError(`Please enter a valid email before continuing with ${provider === 'google' ? 'Google' : 'GitHub'} in demo mode.`);
        return;
      }

      const user = await loginWithProvider(provider, { fullName: fullName || undefined, email: trimmedEmail, role });
      onToast(`Signed in with ${provider === 'google' ? 'Google' : 'GitHub'}`, `Welcome back, ${user.fullName}`);
      onClose();
    } catch (socialError) {
      setError(socialError instanceof Error ? socialError.message : 'Unable to sign in with provider.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{isLogin ? 'Welcome back' : 'Create account'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ayush NextGen Portal · SIH26044</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label="Close auth modal">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Register
            </button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:bg-slate-700"
            >
              <Globe className="h-4 w-4" /> Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:bg-slate-700"
            >
              <Github className="h-4 w-4" /> GitHub
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:bg-slate-700"
            >
              <Mail className="h-4 w-4" /> Email
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800" placeholder="Your full name" />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800" placeholder="name@example.com" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800" placeholder="Enter a password" />
            </div>
          </div>



          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${role === option.value ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-70 shadow-sm shadow-emerald-600/20">
            {submitting ? 'Please wait...' : isLogin ? <><Shield className="h-4 w-4" /> Login</> : <><UserPlus className="h-4 w-4" /> Register</>}
          </button>
        </form>
      </div>
    </div>
  );
}
