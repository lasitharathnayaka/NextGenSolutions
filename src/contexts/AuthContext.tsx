import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

export type StaffRole = 'customer' | 'admin' | 'technician';

export interface ProfileRecord {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  enterprise_id: string | null;
  role: StaffRole;
  is_verified_enterprise: boolean;
  avatar_url: string | null;
  notify_repair_alerts: boolean;
  notify_vat_invoices: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: ProfileRecord | null;
  loading: boolean;
  isAdminOrStaff: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; isAdminOrStaff?: boolean }>;
  signInWithGoogle: () => Promise<{
    error: string | null;
    isAdminOrStaff?: boolean;
  }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null }>;
  resendVerificationEmail: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (
    firebaseUser: User,
  ): Promise<ProfileRecord | null> => {
    if (!db) return null;
    const ref = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const existing: ProfileRecord = {
        id: snap.id,
        ...(snap.data() as Omit<ProfileRecord, 'id'>),
      };
      setProfile(existing);
      return existing;
    } else {
      const enterpriseId = `NGS-${Math.floor(10000 + Math.random() * 90000)}`;
      const freshProfile: ProfileRecord = {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        full_name:
          firebaseUser.displayName ??
          (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Customer'),
        phone: null,
        enterprise_id: enterpriseId,
        role: 'customer',
        is_verified_enterprise: false,
        avatar_url: firebaseUser.photoURL ?? null,
        notify_repair_alerts: true,
        notify_vat_invoices: true,
      };
      await setDoc(ref, { ...freshProfile, created_at: serverTimestamp() });
      setProfile(freshProfile);
      return freshProfile;
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        loadProfile(nextUser).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      return {
        error:
          'Firebase is not configured yet. Copy .env.example to .env and add your VITE_FIREBASE_* values.',
      };
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const loaded = await loadProfile(cred.user);
      return {
        error: null,
        isAdminOrStaff:
          loaded?.role === 'admin' || loaded?.role === 'technician',
      };
    } catch (err) {
      return { error: (err as Error).message };
    }
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      return {
        error:
          'Firebase is not configured yet. Copy .env.example to .env and add your VITE_FIREBASE_* values.',
      };
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const loaded = await loadProfile(cred.user);
      return {
        error: null,
        isAdminOrStaff:
          loaded?.role === 'admin' || loaded?.role === 'technician',
      };
    } catch (err) {
      return { error: (err as Error).message };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isFirebaseConfigured || !auth) {
      return {
        error:
          'Firebase is not configured yet. Copy .env.example to .env and add your VITE_FIREBASE_* values.',
      };
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (fullName) {
        await updateProfile(cred.user, { displayName: fullName });
      }
      await loadProfile(cred.user);
      await sendEmailVerification(cred.user);
      return { error: null };
    } catch (err) {
      return { error: (err as Error).message };
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth?.currentUser) {
      return { error: 'No signed-in user found.' };
    }
    try {
      await sendEmailVerification(auth.currentUser);
      return { error: null };
    } catch (err) {
      return { error: (err as Error).message };
    }
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured || !auth) {
      return {
        error:
          'Firebase is not configured yet. Copy .env.example to .env and add your VITE_FIREBASE_* values.',
      };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (err) {
      return { error: (err as Error).message };
    }
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const isAdminOrStaff =
    profile?.role === 'admin' || profile?.role === 'technician';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdminOrStaff,
        signIn,
        signInWithGoogle,
        signUp,
        resendVerificationEmail,
        resetPassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
