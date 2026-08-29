import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AuthRole = 'student' | 'employer' | 'ministry';

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: AuthRole;
  specialty: string;
  institution: string;
  asqScore: number;
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
  specialty: string;
  institution: string;
};

type AuthContextValue = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (payload: LoginInput) => Promise<UserProfile>;
  signup: (payload: SignupInput) => Promise<UserProfile>;
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
  specialty: 'Ayurveda & Clinical Research',
  institution: 'Ayush Stream Academy',
  asqScore: 88,
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

  const signup = async ({ fullName, email, password, role, specialty, institution }: SignupInput): Promise<UserProfile> => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSpecialty = specialty.trim();
    const trimmedInstitution = institution.trim();

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
      specialty: trimmedSpecialty,
      institution: trimmedInstitution,
      asqScore: 88,
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
      signup,
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
