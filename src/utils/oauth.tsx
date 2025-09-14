import { createClient } from '@supabase/supabase-js';

// Types
export type UserRole = 'student' | 'teacher' | 'ngo';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Supabase client
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth service with Supabase integration
export const authService = {
  // Sign up with email/password and role
  signUp: async (email: string, password: string, name: string, role: UserRole): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to create user');
    }

    return {
      id: data.user.id,
      email: data.user.email || email,
      name: data.user.user_metadata.name || name,
      role: data.user.user_metadata.role || role,
      avatar: data.user.user_metadata.avatar_url,
    };
  },

  // Sign in with email/password
  signIn: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to sign in');
    }

    return {
      id: data.user.id,
      email: data.user.email || email,
      name: data.user.user_metadata.name || data.user.email?.split('@')[0] || 'User',
      role: data.user.user_metadata.role || 'student',
      avatar: data.user.user_metadata.avatar_url,
    };
  },

  // Sign in with Google OAuth
  signInWithGoogle: async (redirectTo?: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/welcome`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  // Sign out
  signOut: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error.message);
      return null;
    }

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata.name || user.email?.split('@')[0] || 'User',
      role: user.user_metadata.role || 'student',
      avatar: user.user_metadata.avatar_url,
    };
  },

  // Reset password
  resetPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
          role: session.user.user_metadata.role || 'student',
          avatar: session.user.user_metadata.avatar_url,
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }
};
