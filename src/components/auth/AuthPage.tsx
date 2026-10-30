import React, { useState } from 'react';
import {
  FileText,
  Search,
  Zap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { LoginIllustration } from '../common/LoginIllustration';
import { ApiService } from '../../services/api';
import { AUTHORIZED_CREATOR_EMAIL } from '../../services/storage';
import { User } from '../../types';

interface AuthPageProps {
  onSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'verify' | 'forgot' | 'admin-setup';
type RolePortal = 'student' | 'admin';

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [rolePortal, setRolePortal] = useState<RolePortal>('student');
  const [mode, setMode] = useState<AuthMode>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Admin credentials state
  const [adminEmail, setAdminEmail] = useState(AUTHORIZED_CREATOR_EMAIL);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSetupPass1, setAdminSetupPass1] = useState('');
  const [adminSetupPass2, setAdminSetupPass2] = useState('');

  // Verification code states (6 digits)
  const [verifyDigits, setVerifyDigits] = useState(['', '', '', '', '', '']);
  const [pendingEmail, setPendingEmail] = useState('');
  const [demoCodeHelper, setDemoCodeHelper] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if admin password is configured
  const isMasterPasswordSet = ApiService.isAdminPasswordConfigured();

  // 1. Social Login (Student Role)
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.socialLogin(provider);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with social provider.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Student Login Submit
  const handleStudentLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide your student email address and password.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.studentLogin(email.trim(), password);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Invalid student credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Admin Login Submit
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      setError('Administrator email is required.');
      return;
    }
    if (!adminPassword.trim()) {
      setError('Administrator master password is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.adminLogin(adminEmail.trim(), adminPassword);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Admin authentication failed. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Initial Admin Setup
  const handleAdminSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSetupPass1 || adminSetupPass1.length < 8) {
      setError('Master password must be at least 8 characters long.');
      return;
    }
    if (adminSetupPass1 !== adminSetupPass2) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.adminLogin(AUTHORIZED_CREATOR_EMAIL, adminSetupPass1);
      setSuccessMessage('Administrator master credentials established successfully!');
      setTimeout(() => onSuccess(res.user), 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to establish admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Student Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill out all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.register(fullName.trim(), email.trim(), password);
      setPendingEmail(email.trim());
      setDemoCodeHelper(res.verificationCode);
      setMode('verify');
      setSuccessMessage(`We sent a 6-digit verification code to ${email.trim()}`);
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Verify Code
  const handleDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, 6);
      const newDigits = [...verifyDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setVerifyDigits(newDigits);
      return;
    }

    const newDigits = [...verifyDigits];
    newDigits[index] = val;
    setVerifyDigits(newDigits);

    if (val && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = verifyDigits.join('');
    if (fullCode.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.verifyEmail(pendingEmail, fullCode);
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      const res = await ApiService.resendVerificationCode(pendingEmail);
      setDemoCodeHelper(res.code);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-6xl bg-white/90 backdrop-blur-xs rounded-3xl border border-[#E2E8F0] shadow-xl overflow-hidden flex flex-col lg:flex-row">
        {/* ================= LEFT SECTION: BRAND PRESENTATION ================= */}
        <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-white via-[#F8FAFC] to-[#F1F5F9] border-b lg:border-b-0 lg:border-r border-[#E2E8F0]">
          <div>
            <Logo size="md" showTagline={true} />

            <div className="mt-10 sm:mt-12">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                <span className="text-[#102A56] block">Your notes.</span>
                <span className="text-[#0DB7A5] block">One place.</span>
              </h1>
              <p className="mt-4 text-base text-[#64748B] leading-relaxed max-w-md font-medium">
                Find the educational PDFs you need. Explore subjects, discover lecture topics, and study at your own pace.
              </p>
            </div>

            <div className="mt-8 space-y-4 max-w-md">
              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/80 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1677FF] flex items-center justify-center shrink-0 shadow-xs border border-blue-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#102A56]">Quality Notes</h4>
                  <p className="text-xs text-[#64748B] mt-0.5 font-normal">
                    Well-organized and easy to read
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/80 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1677FF] flex items-center justify-center shrink-0 shadow-xs border border-blue-100">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#102A56]">Wide Range of Subjects</h4>
                  <p className="text-xs text-[#64748B] mt-0.5 font-normal">
                    From school to university level
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/80 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#E6FFFA] text-[#0DB7A5] flex items-center justify-center shrink-0 shadow-xs border border-teal-100">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#102A56]">Learn Anywhere</h4>
                  <p className="text-xs text-[#64748B] mt-0.5 font-normal">
                    On any device, anytime
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 flex justify-center lg:justify-start">
            <LoginIllustration />
          </div>
        </div>

        {/* ================= RIGHT SECTION: AUTHENTICATION CARD ================= */}
        <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            {/* Top Compact Logo inside right card */}
            <div className="flex justify-center mb-6">
              <Logo size="sm" showTagline={true} />
            </div>

            {/* Error or Success notification banners */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TWO CLEAR OPTIONS: STUDENT LOGIN vs ADMIN LOGIN */}
            {mode === 'login' && (
              <div className="mb-6">
                <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setRolePortal('student');
                      setError(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      rolePortal === 'student'
                        ? 'bg-white text-[#1677FF] shadow-sm'
                        : 'text-slate-600 hover:text-[#102A56]'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Login as Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRolePortal('admin');
                      setError(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      rolePortal === 'admin'
                        ? 'bg-[#102A56] text-white shadow-sm'
                        : 'text-slate-600 hover:text-[#102A56]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Login as Admin</span>
                  </button>
                </div>

                {/* ================= OPTION A: STUDENT LOGIN ================= */}
                {rolePortal === 'student' && (
                  <>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#1677FF] rounded-full text-[11px] font-bold mb-2">
                        <GraduationCap className="w-3.5 h-3.5" /> Student Learning Portal
                      </div>
                      <h2 className="text-2xl font-bold text-[#102A56]">Welcome back!</h2>
                      <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
                        Sign in to access your study materials and reading history.
                      </p>
                    </div>

                    {/* Social Login 1: Google */}
                    <div className="space-y-3 mb-5">
                      <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-semibold text-[#152238] flex items-center justify-center gap-3 transition-colors shadow-xs"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSocialLogin('github')}
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-[#101C34] hover:bg-[#0A1324] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-xs"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          />
                        </svg>
                        <span>Continue with GitHub</span>
                      </button>
                    </div>

                    <div className="relative my-5 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E2E8F0]" />
                      </div>
                      <span className="relative px-3 bg-white text-xs text-[#94A3B8] font-bold tracking-wider">
                        OR
                      </span>
                    </div>

                    <form onSubmit={handleStudentLoginSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#102A56] mb-1.5">
                          Student Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="student@university.edu"
                            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/20 outline-hidden font-medium text-[#152238]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-[#102A56]">Password</label>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingEmail(email);
                              setMode('forgot');
                            }}
                            className="text-xs text-[#1677FF] hover:underline font-semibold"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your student password"
                            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/20 outline-hidden font-medium text-[#152238]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                      >
                        {loading ? 'Authenticating...' : 'Sign in as Student'}
                      </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-[#64748B]">
                      <span>New student? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setMode('register');
                        }}
                        className="text-[#1677FF] font-bold hover:underline ml-1"
                      >
                        Create student account
                      </button>
                    </div>
                  </>
                )}

                {/* ================= OPTION B: ADMIN LOGIN (Creator Only) ================= */}
                {rolePortal === 'admin' && (
                  <div>
                    <div className="text-center mb-5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[11px] font-bold mb-2 border border-purple-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Authorized Creator Portal
                      </div>
                      <h2 className="text-2xl font-bold text-[#102A56]">Administrator Login</h2>
                      <p className="text-xs text-[#64748B] mt-1 font-medium">
                        Reserved exclusively for the website creator and owner.
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium mb-5 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Access is restricted strictly to the verified creator account:{' '}
                        <strong>{AUTHORIZED_CREATOR_EMAIL}</strong>. Public administrator registration is permanently disabled.
                      </span>
                    </div>

                    <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#102A56] mb-1.5">
                          Authorized Administrator Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder="creator@frontpageflip.edu"
                            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#102A56] focus:ring-2 focus:ring-purple-200 outline-hidden font-medium text-[#152238]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-[#102A56]">
                            Master Admin Password
                          </label>
                          {!isMasterPasswordSet && (
                            <button
                              type="button"
                              onClick={() => {
                                setError(null);
                                setMode('admin-setup');
                              }}
                              className="text-[11px] text-purple-600 hover:underline font-bold"
                            >
                              First-time setup?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Enter master admin password"
                            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#102A56] focus:ring-2 focus:ring-purple-200 outline-hidden font-medium text-[#152238]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-3 bg-[#102A56] hover:bg-[#183a73] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{loading ? 'Verifying Authorization...' : 'Authenticate as Administrator'}</span>
                      </button>
                    </form>

                    {!isMasterPasswordSet && (
                      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setMode('admin-setup');
                          }}
                          className="text-xs text-purple-700 font-bold hover:underline flex items-center justify-center gap-1.5 mx-auto"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>First Time? Setup Creator Admin Passphrase</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FIRST-TIME CREATOR ADMIN SETUP */}
            {mode === 'admin-setup' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 mx-auto rounded-full bg-purple-50 text-purple-700 flex items-center justify-center mb-3 border border-purple-200">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#102A56]">Establish Admin Credentials</h2>
                  <p className="text-xs text-[#64748B] mt-1 font-medium">
                    Configure your secure master password for <strong className="text-[#102A56]">{AUTHORIZED_CREATOR_EMAIL}</strong>.
                  </p>
                </div>

                <form onSubmit={handleAdminSetupSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#102A56] mb-1">
                      New Master Administrator Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={adminSetupPass1}
                        onChange={(e) => setAdminSetupPass1(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#102A56] outline-hidden font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102A56] mb-1">
                      Confirm Master Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={adminSetupPass2}
                        onChange={(e) => setAdminSetupPass2(e.target.value)}
                        placeholder="Re-enter master password"
                        className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#102A56] outline-hidden font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#102A56] hover:bg-[#183a73] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{loading ? 'Securing Passphrase...' : 'Save & Login as Administrator'}</span>
                  </button>
                </form>

                <div className="mt-6 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-slate-500 hover:text-slate-700 font-bold"
                  >
                    Cancel and return to login
                  </button>
                </div>
              </div>
            )}

            {/* 2. STUDENT REGISTRATION MODE */}
            {mode === 'register' && (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#1677FF] rounded-full text-[11px] font-bold mb-2">
                    <GraduationCap className="w-3.5 h-3.5" /> Student Registration
                  </div>
                  <h2 className="text-2xl font-bold text-[#102A56]">Create Student Account</h2>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
                    Register as a student to discover, bookmark, and read study notes.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#102A56] mb-1">Full name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102A56] mb-1">Student email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@university.edu"
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102A56] mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] outline-hidden font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#102A56] mb-1">Confirm password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] outline-hidden font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-3 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-bold text-sm rounded-xl transition-all shadow-md"
                  >
                    {loading ? 'Creating student account...' : 'Complete Student Registration'}
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-[#64748B]">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('login');
                      setRolePortal('student');
                    }}
                    className="text-[#1677FF] font-bold hover:underline ml-1"
                  >
                    Sign in
                  </button>
                </div>
              </>
            )}

            {/* 3. EMAIL VERIFICATION MODE */}
            {mode === 'verify' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-[#1677FF] flex items-center justify-center mb-3">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#102A56]">Verify your email</h2>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
                    We sent a verification code to <span className="font-bold text-[#102A56]">{pendingEmail}</span>
                  </p>
                  {demoCodeHelper && (
                    <div className="mt-2 inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-mono font-bold">
                      Verification Code: {demoCodeHelper}
                    </div>
                  )}
                </div>

                <form onSubmit={handleVerifySubmit} className="space-y-6">
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {verifyDigits.map((digit, index) => (
                      <input
                        key={index}
                        id={`digit-${index}`}
                        type="text"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        className="w-11 h-13 text-center text-xl font-bold text-[#102A56] bg-white border-2 border-[#CBD5E1] rounded-xl focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/20 outline-hidden font-mono"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-bold text-sm rounded-xl transition-all shadow-md"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-[#64748B] flex flex-col gap-2">
                  <p>
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendCode}
                      className="text-[#1677FF] font-bold hover:underline"
                    >
                      Resend code
                    </button>
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-slate-400 hover:text-slate-600 mt-2"
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}

            {/* 4. FORGOT PASSWORD MODE */}
            {mode === 'forgot' && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-[#102A56]">Reset password</h2>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
                    Enter your email to receive recovery instructions.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSuccessMessage('Recovery code sent! Use code 123456.');
                    setMode('verify');
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-[#102A56] mb-1">Email address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={pendingEmail}
                        onChange={(e) => setPendingEmail(e.target.value)}
                        placeholder="Enter your registered student email"
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-bold text-sm rounded-xl transition-all shadow-md"
                  >
                    Send Recovery Code
                  </button>
                </form>

                <div className="mt-6 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-[#1677FF] font-bold hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
