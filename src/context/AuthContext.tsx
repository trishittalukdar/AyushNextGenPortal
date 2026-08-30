import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

export type AuthRole = 'student' | 'employer' | 'ministry';
export type AuthProvider = 'google' | 'github' | 'email';
export type UserStatus = 'Student' | 'Unemployed' | 'Working Professional' | 'Freelancer' | 'Career Break';

export const STATUS_OPTIONS: UserStatus[] = ['Student', 'Unemployed', 'Working Professional', 'Freelancer', 'Career Break'];

export const SKILL_CATALOG: Array<{ category: string; skills: string[] }> = [
  { category: 'AI & ML', skills: ['AI/ML', 'Machine Learning', 'Deep Learning', 'Computer Vision', 'NLP', 'Data Science', 'Python', 'Prompt Engineering', 'MLOps'] },
  { category: 'Software', skills: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'MongoDB', 'Git', 'API Development', 'UI/UX'] },
  { category: 'Healthcare & Ayush', skills: ['Ayurveda', 'Panchakarma', 'Clinical Research', 'Pharmacovigilance', 'Public Health', 'NABH', 'Medical Coding', 'Healthcare Operations', 'Clinical Documentation'] },
  { category: 'Research & Data', skills: ['Research', 'Analytics', 'Data Analysis', 'Statistics', 'Biostatistics', 'Business Intelligence', 'Power BI', 'Excel', 'Market Research'] },
  { category: 'Product & Business', skills: ['Product Management', 'Business Development', 'Sales', 'Operations', 'Strategy', 'Customer Success', 'Marketing', 'B2B Sales'] },
  { category: 'Core Engineering', skills: ['Mechanical Design', 'CAD', 'PLC', 'SCADA', 'AutoCAD', 'SolidWorks', 'Process Engineering', 'Quality Assurance'] },
  { category: 'Communication', skills: ['Communication', 'Presentation', 'Leadership', 'Stakeholder Management', 'Project Coordination', 'Teamwork'] },
];

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: AuthRole;
  status: UserStatus;
  specialty: string;
  institution: string;
  skills: string[];
  headline: string;
  location: string;
  bio: string;
  education: string;
  experience: string;
  portfolio: string;
  availability: string;
  asqScore: number;
  skillMatchIndex: number;
  verifiedClinicalHours: number;
};

type LoginInput = {
  email: string;
  password: string;
  role?: AuthRole;
};

type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  role: AuthRole;
  status: UserStatus;
  specialty: string;
  institution: string;
  skills: string[];
  headline: string;
  location: string;
  bio: string;
  education: string;
  experience: string;
  portfolio: string;
  availability: string;
};

type AuthContextValue = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (payload: LoginInput) => Promise<UserProfile>;
  loginWithProvider: (provider: AuthProvider, payload?: Partial<Pick<UserProfile, 'fullName' | 'email' | 'role'>>) => Promise<UserProfile>;
  signup: (payload: SignupInput) => Promise<UserProfile>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<UserProfile>;
  logout: () => void;
};

const STORAGE_KEY = 'ayush-nextgen-current-user';
const USERS_KEY = 'ayush-nextgen-users';

const defaultUser: UserProfile = {
  id: 'user-trishit',
  fullName: 'Trishit Talukdar',
  email: 'trishit@ayushportal.in',
  password: 'demo123',
  role: 'student',
  status: 'Student',
  specialty: 'Ayurveda & Clinical Research',
  institution: 'Ayush Stream Academy',
  skills: ['AI/ML', 'Clinical Research', 'Python', 'React', 'Ayurveda', 'Data Analysis'],
  headline: 'AI-ready healthcare and Ayush professional',
  location: 'India',
  bio: 'Research-oriented healthcare learner focused on AI-enabled clinical workflows, policy, and public health innovation.',
  education: 'BAMS / Clinical Research specialization',
  experience: '2 years of internships, case documentation, and research support',
  portfolio: 'portfolio.ayushportal.in/trishit',
  availability: 'Available for internships and full-time roles',
  asqScore: 88,
  skillMatchIndex: 88,
  verifiedClinicalHours: 34,
};

function getStoredUsers(): UserProfile[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserProfile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function seedDefaultUser() {
  if (typeof window === 'undefined') return;
  const users = getStoredUsers();
  if (!users.some((user) => user.email.toLowerCase() === defaultUser.email.toLowerCase())) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify([defaultUser, ...users]));
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    seedDefaultUser();
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        if (parsed?.email) setUser(parsed);
      } catch {
        setUser(null);
      }
    }
  }, []);

  const login = async ({ email, password, role }: LoginInput): Promise<UserProfile> => {
    const normalizedEmail = email.trim().toLowerCase();

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) throw new Error(error.message || 'Unable to sign in.');

      const profile: UserProfile = {
        id: data.user.id,
        fullName: data.user.user_metadata?.full_name || 'Supabase User',
        email: data.user.email || normalizedEmail,
        password,
        role: role || 'student',
        status: 'Student',
        specialty: 'Career-focused professional',
        institution: 'Supabase authenticated account',
        skills: ['AI/ML', 'Research', 'Data Analysis'],
        headline: 'Career-focused learner',
        location: 'India',
        bio: 'Verified Supabase user profile.',
        education: 'Profile details pending',
        experience: 'Early career profile',
        portfolio: 'https://example.com/portfolio',
        availability: 'Open to opportunities',
        asqScore: 88,
        skillMatchIndex: 88,
        verifiedClinicalHours: 34,
      };

      setUser(profile);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }
      return profile;
    }

    const users = getStoredUsers();
    const matchedUser = users.find(
      (entry) =>
        entry.email.toLowerCase() === normalizedEmail &&
        entry.password === password &&
        (!role || entry.role === role)
    );

    if (!matchedUser) {
      throw new Error('Invalid email, password, or role selection.');
    }

    setUser(matchedUser);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(matchedUser));
    }
    return matchedUser;
  };

  const loginWithProvider = async (provider: AuthProvider, payload?: Partial<Pick<UserProfile, 'fullName' | 'email' | 'role'>>): Promise<UserProfile> => {
    const safeName = (payload?.fullName || `${provider.charAt(0).toUpperCase()}${provider.slice(1)} User`).trim();
    const safeEmail = (payload?.email || `${provider}-user@ayushportal.local`).trim().toLowerCase();
    const safeRole = (payload?.role || 'student') as AuthRole;

    if (hasSupabaseConfig && supabase) {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl },
      });
      if (error) throw new Error(error.message || 'Unable to sign in.');
      if (data?.url) {
        window.location.href = data.url;
      }

      const socialUser: UserProfile = {
        id: `provider-${provider}-${Date.now()}`,
        fullName: safeName,
        email: safeEmail,
        password: `${provider}-oauth`,
        role: safeRole,
        status: 'Student',
        specialty: 'Digital learning & career growth',
        institution: `${provider.charAt(0).toUpperCase()}${provider.slice(1)} Account`,
        skills: ['AI/ML', 'Research', 'Data Analysis'],
        headline: 'Career-focused learner',
        location: 'India',
        bio: 'Authenticated through a verified provider connection.',
        education: 'Profile details pending',
        experience: 'Early career profile',
        portfolio: 'https://example.com/portfolio',
        availability: 'Open to opportunities',
        asqScore: 88,
        skillMatchIndex: 88,
        verifiedClinicalHours: 34,
      };

      setUser(socialUser);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(socialUser));
      }
      return socialUser;
    }

    const users = getStoredUsers();
    const existing = users.find((entry) => entry.email.toLowerCase() === safeEmail);
    const nextUser: UserProfile = existing ?? {
      id: `provider-${provider}-${Date.now()}`,
      fullName: safeName,
      email: safeEmail,
      password: `${provider}-oauth`,
      role: safeRole,
      status: 'Student',
      specialty: 'Digital learning & career growth',
      institution: `${provider.charAt(0).toUpperCase()}${provider.slice(1)} Account`,
      skills: ['AI/ML', 'Research', 'Data Analysis'],
      headline: 'Career-focused learner',
      location: 'India',
      bio: 'Career-focused professional building a strong digital and sector-ready profile.',
      education: 'Higher education / career-track learner',
      experience: 'Early-career profile with internships and project experience',
      portfolio: 'https://example.com/portfolio',
      availability: 'Open to opportunities',
      asqScore: 88,
      skillMatchIndex: 88,
      verifiedClinicalHours: 34,
    };

    const finalUser = existing ?? nextUser;
    const updatedUsers = existing ? users : [nextUser, ...users];

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(finalUser));
    }

    setUser(finalUser);
    return finalUser;
  };

  const signup = async ({ fullName, email, password, role, status, specialty, institution, skills, headline, location, bio, education, experience, portfolio, availability }: SignupInput): Promise<UserProfile> => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSpecialty = specialty.trim();
    const trimmedInstitution = institution.trim();

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            role,
            status,
            specialty: trimmedSpecialty,
            institution: trimmedInstitution,
            headline: headline.trim() || 'Career-focused learner',
            location: location.trim() || 'India',
            bio: bio.trim() || 'Career-focused professional with a strong growth mindset and practical experience.',
            education: education.trim() || 'Education details not added yet',
            experience: experience.trim() || 'Early career / internship experience',
            portfolio: portfolio.trim() || 'https://example.com/portfolio',
            availability: availability.trim() || 'Open to opportunities',
            skills: Array.from(new Set(skills.map((skill) => skill.trim()).filter(Boolean))).slice(0, 12),
          },
        },
      });

      if (error) throw new Error(error.message || 'Unable to create account.');

      const nextUser: UserProfile = {
        id: data.user?.id || `user-${Date.now()}`,
        fullName: trimmedName,
        email: trimmedEmail,
        password,
        role,
        status,
        specialty: trimmedSpecialty,
        institution: trimmedInstitution,
        skills: Array.from(new Set(skills.map((skill) => skill.trim()).filter(Boolean))).slice(0, 12),
        headline: headline.trim() || 'Career-focused learner',
        location: location.trim() || 'India',
        bio: bio.trim() || 'Career-focused professional with a strong growth mindset and practical experience.',
        education: education.trim() || 'Education details not added yet',
        experience: experience.trim() || 'Early career / internship experience',
        portfolio: portfolio.trim() || 'https://example.com/portfolio',
        availability: availability.trim() || 'Open to opportunities',
        asqScore: 88,
        skillMatchIndex: 88,
        verifiedClinicalHours: 34,
      };

      setUser(nextUser);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      }
      return nextUser;
    }

    if (!trimmedName || !trimmedEmail || !password || !trimmedSpecialty || !trimmedInstitution) {
      throw new Error('Please complete all required fields.');
    }

    const users = getStoredUsers();
    const existing = users.find((entry) => entry.email.toLowerCase() === trimmedEmail);
    if (existing) {
      throw new Error('An account with that email already exists.');
    }

    const nextUser: UserProfile = {
      id: `user-${Date.now()}`,
      fullName: trimmedName,
      email: trimmedEmail,
      password,
      role,
      status,
      specialty: trimmedSpecialty,
      institution: trimmedInstitution,
      skills: Array.from(new Set(skills.map((skill) => skill.trim()).filter(Boolean))).slice(0, 12),
      headline: headline.trim() || 'Career-focused learner',
      location: location.trim() || 'India',
      bio: bio.trim() || 'Career-focused professional with a strong growth mindset and practical experience.',
      education: education.trim() || 'Education details not added yet',
      experience: experience.trim() || 'Early career / internship experience',
      portfolio: portfolio.trim() || 'https://example.com/portfolio',
      availability: availability.trim() || 'Open to opportunities',
      asqScore: 88,
      skillMatchIndex: 88,
      verifiedClinicalHours: 34,
    };

    const updatedUsers = [nextUser, ...users];
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    }

    setUser(nextUser);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    }
    return nextUser;
  };

  const updateProfile = async (patch: Partial<UserProfile>): Promise<UserProfile> => {
    if (!user) {
      throw new Error('No active user found.');
    }

    const nextUser: UserProfile = { ...user, ...patch };
    setUser(nextUser);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      const users = getStoredUsers();
      const updatedUsers = users.map((entry) => (entry.email.toLowerCase() === nextUser.email.toLowerCase() ? nextUser : entry));
      window.localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers.length ? updatedUsers : [nextUser]));
    }

    return nextUser;
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      loginWithProvider,
      signup,
      updateProfile,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
