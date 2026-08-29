import { useMemo, useState } from 'react';
import { Github, Globe, Lock, LogIn, Mail, Shield, UserPlus, X } from 'lucide-react';
import { useAuth, type AuthRole, STATUS_OPTIONS, SKILL_CATALOG, type UserStatus } from '@/context/AuthContext';

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
  const [location, setLocation] = useState(user?.location ?? 'India');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [education, setEducation] = useState(user?.education ?? '');
  const [experience, setExperience] = useState(user?.experience ?? '');
  const [portfolio, setPortfolio] = useState(user?.portfolio ?? '');
  const [availability, setAvailability] = useState(user?.availability ?? 'Available for opportunities');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(user?.skills ?? ['AI/ML', 'Python']);
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

    if (!fullName.trim() || !email.trim() || !password.trim() || !specialty.trim() || !institution.trim() || !selectedSkills.length) {
      setError('Please complete all signup fields and select at least one skill.');
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
      const user = await loginWithProvider(provider, { fullName: fullName || undefined, role });
      onToast(`Signed in with ${provider === 'google' ? 'Google' : 'GitHub'}`, `Welcome back, ${user.fullName}`);
      onClose();
    } catch (socialError) {
      setError(socialError instanceof Error ? socialError.message : 'Unable to sign in with provider.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{isLogin ? 'Welcome back' : 'Create account'}</h3>
              <p className="text-xs text-slate-500">Ayush NextGen Portal · SIH26044</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Close auth modal">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
            >
              Register
            </button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-70"
            >
              <Globe className="h-4 w-4" /> Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-70"
            >
              <Github className="h-4 w-4" /> GitHub
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Mail className="h-4 w-4" /> Email
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="Trishit Talukdar" />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="name@example.com" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="••••••••" />
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Current Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStatus(option)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${status === option ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Ayush Specialty / Domain</label>
                <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="Ayurveda, Pharmacovigilance, AI, etc." />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Headline</label>
                <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="AI-ready healthcare and Ayush professional" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">About / Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="Research-oriented healthcare learner focused on AI-enabled clinical workflows and public health." />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="India" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Institution / Organization</label>
                <input value={institution} onChange={(e) => setInstitution(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="Ayush Stream Academy" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Education / Qualification</label>
                <input value={education} onChange={(e) => setEducation(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="BAMS / MSc Clinical Research" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Experience</label>
                <input value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="2 years internships, research projects, clinical case support" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Portfolio / LinkedIn</label>
                <input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="https://linkedin.com/in/your-profile" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Availability</label>
                <input value={availability} onChange={(e) => setAvailability(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20" placeholder="Available for internships and full-time roles" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Skills</label>
                <div className="space-y-3">
                  {SKILL_CATALOG.map((group) => (
                    <div key={group.category}>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{group.category}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.skills.map((skill) => {
                          const active = selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => setSelectedSkills((prev) => active ? prev.filter((item) => item !== skill) : [...prev, skill].slice(0, 12))}
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${active ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'}`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${role === option.value ? 'border-emerald-500 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-70">
            {submitting ? 'Please wait...' : isLogin ? <><Shield className="h-4 w-4" /> Login</> : <><UserPlus className="h-4 w-4" /> Register</>}
          </button>
        </form>
      </div>
    </div>
  );
}
