import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getAppState } from './dbState';

export type UserRole = 'supervisor' | 'contractor' | 'admin';

export interface AppUser {
  id: string | number;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

const AUTH_STORAGE_KEY = 'construct_track_auth_session_v1';

export function getMasterCredentials() {
  const state = getAppState();
  return state.adminCredentials || {
    id: 1,
    username: 'admin',
    passwordHash: 'admin',
    name: 'Site Manager & Owner',
    email: 'admin@constructtrack.com',
    phone: '+91 9876543210',
  };
}

export function getSessionUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse auth session:', e);
  }
  return null;
}

export async function loginUser(emailOrUsername: string, passwordAttempt: string, rememberMe: boolean = true): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const cleanInput = emailOrUsername.trim();

  // 1. If Supabase Cloud Auth is configured, attempt Supabase Auth first
  if (isSupabaseConfigured && supabase && cleanInput.includes('@')) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanInput,
        password: passwordAttempt,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const userMeta = data.user.user_metadata || {};
        const sessionUser: AppUser = {
          id: data.user.id,
          username: cleanInput.split('@')[0],
          email: data.user.email || cleanInput,
          name: userMeta.name || userMeta.full_name || cleanInput.split('@')[0],
          role: (userMeta.role as UserRole) || 'admin',
        };

        saveUserSession(sessionUser, rememberMe);
        return { success: true, user: sessionUser };
      }
    } catch (err: any) {
      console.warn('[Supabase Auth] Fallback to database check:', err);
    }
  }

  // 2. Database & Master Credentials Fallback
  const masterCreds = getMasterCredentials();
  const lowerInput = cleanInput.toLowerCase();

  const isUserValid = (
    lowerInput === masterCreds.username.toLowerCase() ||
    lowerInput === masterCreds.email.toLowerCase() ||
    lowerInput === 'user' ||
    lowerInput === 'owner' ||
    lowerInput === 'supervisor' ||
    lowerInput === 'admin'
  );

  if (!isUserValid) {
    return { success: false, error: 'Invalid Email or Username' };
  }

  if (masterCreds.passwordHash !== passwordAttempt) {
    return { success: false, error: 'Incorrect Password. Please try again.' };
  }

  const sessionUser: AppUser = {
    id: masterCreds.id,
    username: masterCreds.username,
    name: masterCreds.name,
    role: 'admin',
    email: masterCreds.email,
    phone: masterCreds.phone,
  };

  saveUserSession(sessionUser, rememberMe);
  return { success: true, user: sessionUser };
}

export async function registerUser(email: string, passwordAttempt: string, name: string, role: UserRole = 'admin'): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (passwordAttempt.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: passwordAttempt,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const sessionUser: AppUser = {
          id: data.user.id,
          username: cleanEmail.split('@')[0],
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          role,
        };

        saveUserSession(sessionUser, true);
        return { success: true, user: sessionUser };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  }

  // Local fallback registration
  const sessionUser: AppUser = {
    id: Date.now(),
    username: cleanEmail.split('@')[0],
    email: cleanEmail,
    name,
    role,
  };

  saveUserSession(sessionUser, true);
  return { success: true, user: sessionUser };
}

export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[Supabase Auth] Error signing out:', e);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function saveUserSession(user: AppUser, rememberMe: boolean) {
  if (typeof window !== 'undefined') {
    const dataStr = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, dataStr);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, dataStr);
    }
  }
}
