import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Wrench,
  Check,
  Loader2,
  Sparkles,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';

function formatAuthError(raw: string): string {
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (raw.includes('auth/user-not-found')) {
    return 'No account found with this email address. Please sign up first.';
  }
  if (raw.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (raw.includes('auth/weak-password')) {
    return 'Password is too weak. Please use at least 6 characters with letters and numbers.';
  }
  if (raw.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (raw.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (raw.includes('auth/popup-closed-by-user') || raw.includes('auth/cancelled-popup-request')) {
    return 'Google sign-in popup was closed before completing.';
  }
  if (raw.includes('auth/popup-blocked')) {
    return 'Popup was blocked by your browser. Please allow popups for this site and try again.';
  }
  if (raw.includes('auth/operation-not-allowed')) {
    return 'Google Sign-In is not enabled in Firebase Console yet. Enable Google under Authentication → Sign-in method.';
  }
  if (raw.includes('auth/unauthorized-domain')) {
    return 'This domain is not authorized in Firebase Console → Authentication → Settings → Authorized domains.';
  }
  return raw;
}

function getPasswordStrength(pw: string): {
  score: number;
  label: string;
  barColor: string;
  textColor: string;
} {
  if (!pw) {
    return { score: 0, label: '', barColor: 'bg-slate-200', textColor: 'text-slate-400' };
  }
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;

  if (score <= 1) {
    return { score: 1, label: 'Weak', barColor: 'bg-rose-500', textColor: 'text-rose-600' };
  }
  if (score === 2) {
    return { score: 2, label: 'Fair', barColor: 'bg-amber-500', textColor: 'text-amber-600' };
  }
  if (score === 3) {
    return { score: 3, label: 'Good', barColor: 'bg-sky-500', textColor: 'text-sky-600' };
  }
  return { score: 4, label: 'Strong', barColor: 'bg-emerald-500', textColor: 'text-emerald-600' };
}

export function AuthPage({
  initialMode = 'login',
}: {
  initialMode?: 'login' | 'register';
}) {
  const { signIn, signInWithGoogle, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { from?: string; notice?: string } | null;

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [forgotMode, setForgotMode] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setForgotMode(false);
    setErrorMsg(null);
  }, [initialMode]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleLoading(true);
    const { error, isAdminOrStaff } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) {
      setErrorMsg(formatAuthError(error));
    } else {
      navigate(isAdminOrStaff ? '/admin' : locationState?.from || '/', {
        replace: true,
      });
    }
  };

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setForgotMode(false);
    setErrorMsg(null);
    setSuccessMsg(null);
    navigate(nextMode === 'login' ? '/login' : '/signup', {
      replace: true,
      state: locationState,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (forgotMode) {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address to receive a password reset link.');
        return;
      }
      setSubmitting(true);
      const { error } = await resetPassword(email.trim());
      setSubmitting(false);
      if (error) {
        setErrorMsg(formatAuthError(error));
      } else {
        setSuccessMsg(
          'Password reset link sent! Check your inbox (and spam folder) to reset your password.',
        );
        setForgotMode(false);
      }
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please re-enter your confirmation password.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
    }

    setSubmitting(true);

    if (mode === 'login') {
      const { error, isAdminOrStaff } = await signIn(email.trim(), password);
      setSubmitting(false);
      if (error) {
        setErrorMsg(formatAuthError(error));
      } else {
        navigate(
          isAdminOrStaff ? '/admin' : locationState?.from || '/',
          { replace: true },
        );
      }
    } else {
      const { error } = await signUp(email.trim(), password, fullName.trim());
      setSubmitting(false);
      if (error) {
        setErrorMsg(formatAuthError(error));
      } else {
        setSuccessMsg(
          'Account created! A verification email has been sent to your inbox — you can sign in now.',
        );
        setPassword('');
        setConfirmPassword('');
        setMode('login');
        navigate('/login', { replace: true, state: locationState });
      }
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-slate-100 via-[#eef4fa] to-sky-50/70 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Subtle decorative ambient blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-sky-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_24px_70px_-15px_rgba(10,18,32,0.18)] grid lg:grid-cols-12">
        {/* LEFT BRAND SHOWCASE PANEL */}
        <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between overflow-hidden bg-[#08111e] p-9 text-white">
          {/* Background studio photography with crossfade */}
          <img
            src={
              mode === 'login'
                ? '/images/hero-bg-workstation.jpg'
                : '/images/hero-bg-workspace.jpg'
            }
            alt="NextGenSolution Hardware Studio"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30 transition-all duration-700"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#08111e]/95 via-[#0a1628]/88 to-[#07182d]/95" />

          {/* Animated Aurora Glows & Subtle Grid */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-sky-500/25 blur-3xl animate-aurora-1" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl animate-aurora-2" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07] animate-grid-drift"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(56,189,248,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.6) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          {/* Top Brand + Pill */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src="/images/nextgen-logo.jpg"
                alt="NextGenSolution logo"
                className="h-10 w-10 rounded-xl object-cover border border-sky-400/40 shadow-sm group-hover:border-sky-300/80 transition"
              />
              <div>
                <span className="block text-base font-extrabold tracking-tight text-white">
                  NextGenSolution
                </span>
                <span className="block text-[10px] font-medium uppercase tracking-widest text-sky-400/90">
                  Enterprise Hardware &amp; Labs
                </span>
              </div>
            </Link>

            <div className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {mode === 'login'
                  ? 'Customer & Enterprise Portal'
                  : 'Instant Account Provisioning'}
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-white">
              {mode === 'login' ? (
                <>
                  Welcome back to your{' '}
                  <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                    Hardware Command Center.
                  </span>
                </>
              ) : (
                <>
                  Power up with{' '}
                  <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                    Certified Hardware &amp; Vault Access.
                  </span>
                </>
              )}
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-300/90">
              {mode === 'login'
                ? 'Manage hardware orders, retrieve verified software keys, and track live lab diagnostics in one place.'
                : 'Create your NextGenSolution ID to checkout hardware, store genuine software licenses, and book priority lab repairs.'}
            </p>
          </div>

          {/* Middle Feature Cards */}
          <div className="relative z-10 my-7 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white">40-Point Certified Inventory</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Factory-sealed workstations &amp; Grade-A laptops with full warranty.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white">Instant Software Key Vault</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Genuine Windows, Office &amp; Creative Suite keys stored securely.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                <Wrench className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-white">Live Diagnostic Tracking</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Approve estimates and monitor board-level repairs step-by-step.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Stats & Hub Location */}
          <div className="relative z-10 border-t border-white/10 pt-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white/[0.04] py-2 border border-white/5">
                <p className="text-sm font-extrabold text-white">99.9%</p>
                <p className="text-[10px] text-slate-400">Reliability</p>
              </div>
              <div className="rounded-xl bg-white/[0.04] py-2 border border-white/5">
                <p className="text-sm font-extrabold text-sky-400">24h</p>
                <p className="text-[10px] text-slate-400">Lab Triage</p>
              </div>
              <div className="rounded-xl bg-white/[0.04] py-2 border border-white/5">
                <p className="text-sm font-extrabold text-emerald-400">3-Year</p>
                <p className="text-[10px] text-slate-400">Warranty</p>
              </div>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <MapPin className="h-3 w-3 text-sky-400" />
              <span>Piliyandala Service Hub · Honnanthara South</span>
            </p>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          {/* Mobile-only dark brand header */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <img
                src="/images/nextgen-logo.jpg"
                alt="NextGenSolution logo"
                className="h-9 w-9 rounded-xl object-cover border border-sky-500/30 shadow-xs"
              />
              <span className="text-sm font-extrabold tracking-tight text-slate-900">
                NextGenSolution
              </span>
            </Link>
            <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[10px] font-semibold text-[#0284c7]">
              Secure Portal
            </span>
          </div>

          {/* Segmented Mode Switcher */}
          {!forgotMode ? (
            <div className="mb-7 inline-grid w-full grid-cols-2 rounded-2xl bg-slate-100 p-1.5 border border-slate-200/70">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`rounded-xl py-2.5 text-xs font-bold transition cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#0a1220] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`rounded-xl py-2.5 text-xs font-bold transition cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#0a1220] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setForgotMode(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0284c7] transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </button>
          )}

          {/* Form Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {forgotMode
                ? 'Reset Your Password'
                : mode === 'login'
                  ? 'Sign in to your account'
                  : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-xs text-slate-500">
              {forgotMode
                ? 'Enter the email linked to your NextGenSolution account and we will send a recovery link.'
                : mode === 'login'
                  ? 'Enter your credentials to access your orders, software vault, and repair tickets.'
                  : 'Join NextGenSolution to unlock express checkout, warranty tracking, and instant keys.'}
            </p>
          </div>

          {/* Alerts & Status Banners */}
          {!isFirebaseConfigured && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Firebase credentials are not configured in <code>.env</code> yet. Add your{' '}
                <code>VITE_FIREBASE_*</code> values to enable live authentication.
              </span>
            </div>
          )}

          {locationState?.notice && !errorMsg && !successMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-sky-200 bg-sky-50/80 p-3.5 text-xs text-sky-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0284c7]" />
              <span>{locationState.notice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          {!forgotMode && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || submitting}
                className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                )}
                <span>
                  {googleLoading
                    ? 'Connecting to Google...'
                    : mode === 'login'
                      ? 'Continue with Google'
                      : 'Sign up with Google'}
                </span>
              </button>

              <div className="relative my-5 flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="absolute bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  or with email
                </span>
              </div>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!forgotMode && mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Lasitha Rathnayake"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#0284c7] focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#0284c7] focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:outline-none"
                />
              </div>
            </div>

            {!forgotMode && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(true);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      mode === 'login' ? 'Enter your password' : 'Minimum 6 characters'
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#0284c7] focus:bg-white focus:ring-4 focus:ring-sky-500/10 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Live Password Strength Meter on Register */}
                {mode === 'register' && password.length > 0 && (
                  <div className="mt-2">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 rounded-full transition-colors ${
                            passwordStrength.score >= level
                              ? passwordStrength.barColor
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Password strength</span>
                      <span className={`font-semibold ${passwordStrength.textColor}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!forgotMode && mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className={`w-full rounded-xl border bg-slate-50/70 py-3 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:ring-4 focus:outline-none ${
                      confirmPassword.length > 0 && !passwordsMatch
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
                        : 'border-slate-200 focus:border-[#0284c7] focus:ring-sky-500/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p
                    className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${
                      passwordsMatch ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <span>Passwords do not match</span>
                    )}
                  </p>
                )}
              </div>
            )}

            {!forgotMode && mode === 'login' && (
              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#0284c7] focus:ring-sky-500 cursor-pointer"
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#0284c7] bg-[length:200%_auto] py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition-all hover:bg-right hover:shadow-sky-500/35 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {forgotMode
                      ? 'Sending Reset Link...'
                      : mode === 'login'
                        ? 'Signing In...'
                        : 'Creating Account...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {forgotMode
                      ? 'Send Password Reset Link'
                      : mode === 'login'
                        ? 'Sign In to Account'
                        : 'Create Enterprise Account'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch & Security Footer */}
          {!forgotMode && (
            <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
              {mode === 'login' ? (
                <>
                  New to NextGenSolution?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-bold text-[#0284c7] hover:text-[#0369a1] hover:underline cursor-pointer"
                  >
                    Create a free account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-bold text-[#0284c7] hover:text-[#0369a1] hover:underline cursor-pointer"
                  >
                    Sign in instead
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Firebase Auth Protected</span>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-sky-500" />
              <span>256-Bit Encrypted Session</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
