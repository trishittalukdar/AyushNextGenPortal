import { useState, useEffect } from 'react';
import { User, Palette, Shield, Save, SunMedium, Moon, LogOut, Mail } from 'lucide-react';
import { useAuth, type UserStatus, STATUS_OPTIONS, SKILL_CATALOG } from '@/context/AuthContext';

export function SettingsPage({ theme, setTheme, onToast }: { theme: 'light' | 'dark'; setTheme: (t: 'light' | 'dark') => void; onToast: (message: string, submessage?: string) => void }) {
  const { user, updateProfile, logout } = useAuth();
  const [draft, setDraft] = useState({
    fullName: '',
    email: '',
    role: 'student' as 'student' | 'employer' | 'ministry',
    status: 'Student' as UserStatus,
    specialty: '',
    institution: '',
    location: '',
    headline: '',
    bio: '',
    education: '',
    experience: '',
    portfolio: '',
    availability: '',
    skills: [] as string[],
    skillMatchIndex: 0,
    verifiedClinicalHours: 0,
  });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'account' | 'appearance'>('account');

  useEffect(() => {
    if (!user) return;
    setDraft({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({
        fullName: draft.fullName,
        status: draft.status,
        specialty: draft.specialty,
        institution: draft.institution,
        location: draft.location,
        headline: draft.headline,
        bio: draft.bio,
        education: draft.education,
        experience: draft.experience,
        portfolio: draft.portfolio,
        availability: draft.availability,
        skills: draft.skills,
        skillMatchIndex: draft.skillMatchIndex,
        verifiedClinicalHours: draft.verifiedClinicalHours,
      });
      onToast('Settings saved', 'Your account details and preferences have been updated.');
    } catch {
      onToast('Error', 'Could not save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onToast('Signed out', 'You have been logged out successfully.');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Please log in to access your account settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Settings</p>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Account & Preferences</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <div className={`${activeSection === 'account' ? 'block' : 'hidden'} space-y-6 lg:col-start-2 lg:row-start-1`}>
          <section id="account-details" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Account Details</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update your personal information</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-700 dark:text-slate-300">
                <span className="mb-1.5 block font-medium">Full Name</span>
                <input
                  value={draft.fullName}
                  onChange={(e) => setDraft((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </label>

              <label className="block text-sm text-slate-700 dark:text-slate-300">
                <span className="mb-1.5 block font-medium">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={draft.email}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 pl-10 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Email is used for login and cannot be changed here.</p>
              </label>

              <label className="block text-sm text-slate-700 dark:text-slate-300">
                <span className="mb-1.5 block font-medium">Status</span>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as UserStatus }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-700 dark:text-slate-300">
                <span className="mb-1.5 block font-medium">Specialty</span>
                <input
                  value={draft.specialty}
                  onChange={(e) => setDraft((prev) => ({ ...prev, specialty: e.target.value }))}
                  placeholder="Ayurveda, data science, product, etc."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </label>

              <label className="block text-sm text-slate-700 dark:text-slate-300">
                <span className="mb-1.5 block font-medium">Institution</span>
                <input
                  value={draft.institution}
                  onChange={(e) => setDraft((prev) => ({ ...prev, institution: e.target.value }))}
                  placeholder="College, company, or organization"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </label>

              <label className="block text-sm text-slate-700 dark:text-slate-300">
                <span className="mb-1.5 block font-medium">Location</span>
                <input
                  value={draft.location}
                  onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Your city or country"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </label>

              <label className="block text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
                <span className="mb-1.5 block font-medium">Headline</span>
                <input
                  value={draft.headline}
                  onChange={(e) => setDraft((prev) => ({ ...prev, headline: e.target.value }))}
                  placeholder="e.g. AI-ready healthcare professional"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </label>

              <label className="block text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
                <span className="mb-1.5 block font-medium">Bio</span>
                <textarea
                  value={draft.bio}
                  onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell people about your background, interests, and goals"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </label>

              <label className="block text-sm text-slate-700 dark:text-slate-300">
                <span className="mb-1.5 block font-medium">Education</span>
                <input
                  value={draft.education}
                  onChange={(e) => setDraft((prev) => ({ ...prev, education: e.target.value }))}
                  placeholder="Degree, course, or certification"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </label>

              <label className="block text-sm text-slate-700 dark:text-slate-300">
                <span className="mb-1.5 block font-medium">Experience</span>
                <input
                  value={draft.experience}
                  onChange={(e) => setDraft((prev) => ({ ...prev, experience: e.target.value }))}
                  placeholder="Internships, roles, or projects"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </label>

              <label className="block text-sm text-slate-700 dark:text-slate-300">
                <span className="mb-1.5 block font-medium">Portfolio / LinkedIn</span>
                <input
                  value={draft.portfolio}
                  onChange={(e) => setDraft((prev) => ({ ...prev, portfolio: e.target.value }))}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </label>

              <label className="block text-sm text-slate-700 dark:text-slate-300">
                <span className="mb-1.5 block font-medium">Availability</span>
                <input
                  value={draft.availability}
                  onChange={(e) => setDraft((prev) => ({ ...prev, availability: e.target.value }))}
                  placeholder="Open to internships, freelance, full-time"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </section>

          <section id="appearance" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Skills</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Select skills that match your profile</p>
              </div>
            </div>

            <div className="space-y-4">
              {SKILL_CATALOG.map((group) => (
                <div key={group.category}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{group.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill) => {
                      const active = draft.skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => setDraft((prev) => {
                            const nextSkills = active
                              ? prev.skills.filter((item) => item !== skill)
                              : [...prev.skills, skill];
                            return { ...prev, skills: nextSkills };
                          })}
                          className={`rounded-lg border px-2.5 py-2 text-left text-xs transition ${
                            active
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-300'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="contents">
          <section className="lg:col-start-1 lg:row-start-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Settings</p>
            <button type="button" onClick={() => setActiveSection('account')} className={`mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${activeSection === 'account' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              <User className="h-4 w-4" /> Account details
            </button>
            <button type="button" onClick={() => setActiveSection('appearance')} className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${activeSection === 'appearance' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
              <Palette className="h-4 w-4" /> Appearance
            </button>
          </section>
          <section className={`${activeSection === 'appearance' ? 'block' : 'hidden'} lg:col-start-2 lg:row-start-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Appearance</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Switch theme</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  theme === 'light'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
                }`}
              >
                <SunMedium className="h-4 w-4" /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
                }`}
              >
                <Moon className="h-4 w-4" /> Dark
              </button>
            </div>
          </section>

          <section className={`${activeSection === 'appearance' ? 'block' : 'hidden'} lg:col-start-2 lg:row-start-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Session</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage your active session</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
