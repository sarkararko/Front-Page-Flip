import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  GraduationCap,
  RotateCw,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { User } from '../../types';

export const USER_ARTWORK_IMAGE_URL =
  'https://res.cloudinary.com/fi4r80wz/image/upload/v1793374381/Picsart_26-10-30_21-00-45-909.jpg_joebuu.jpg';
export const USER_BACKGROUND_IMAGE_URL = USER_ARTWORK_IMAGE_URL;

interface AuthPageProps {
  onSuccess: (user: User) => void;
}

type RoleTab = 'student' | 'admin';
type StudentMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  // Option A (Student) vs Option B (Admin)
  const [activeRole, setActiveRole] = useState<RoleTab>('student');
  const [studentMode, setStudentMode] = useState<StudentMode>('login');

  // Student form fields
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Admin form fields
  const [adminEmail, setAdminEmail] = useState('arkaparna.ds@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Verification state (6 digits)
  const [verifyDigits, setVerifyDigits] = useState(['', '', '', '', '', '']);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Password reset fields
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Read URL query parameters on mount (e.g. from 1-click email links)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const modeParam = params.get('mode');
      const emailParam = params.get('email');
      const codeParam = params.get('code') || params.get('token');

      if (roleParam === 'admin') {
        setActiveRole('admin');
      }

      if (emailParam) {
        setPendingEmail(emailParam);
        setStudentEmail(emailParam);
      }

      if (modeParam === 'verify' || modeParam === 'verification') {
        setStudentMode('verify');
        if (codeParam && codeParam.length === 6) {
          setVerifyDigits(codeParam.split(''));
        }
      } else if (modeParam === 'reset') {
        setStudentMode('reset');
        if (codeParam) {
          setResetToken(codeParam);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Cooldown countdown timer for resending verification email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 1. Social Login
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.socialLogin(provider);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Social authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Student Login
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = studentEmail.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.studentLogin(cleanEmail, studentPassword);
      onSuccess(res.user);
    } catch (err: any) {
      const msg = err?.message || 'Failed to authenticate student account.';
      if (msg.toLowerCase().includes('not verified') || msg.toLowerCase().includes('verification')) {
        setPendingEmail(cleanEmail);
        setStudentMode('verify');
        setError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Student Registration
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentEmail.trim() || !studentPassword.trim()) {
      setError('Please fill out all required fields.');
      return;
    }
    if (studentPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (studentPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.register(fullName.trim(), studentEmail.trim(), studentPassword);
      setPendingEmail(studentEmail.trim());
      setStudentMode('verify');
      setResendCooldown(60);
      setSuccessMessage(
        res.message || `A 6-digit verification code has been dispatched to ${studentEmail.trim()} via Brevo.`
      );
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();

    if (!cleanEmail || !adminPassword) {
      setError('Please enter both email and passphrase.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.adminLogin(cleanEmail, adminPassword);
      onSuccess(res.user);
    } catch {
      setError('Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Verification Code handling
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
      setError(err?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.resendVerificationCode(pendingEmail);
      setResendCooldown(60);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.forgotPassword(pendingEmail.trim());
      setSuccessMessage(res.message);
      setStudentMode('reset');
    } catch (err: any) {
      setError(err?.message || 'Failed to process password recovery.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim()) {
      setError('Please enter the 6-digit recovery code from your email.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.resetPassword(pendingEmail.trim(), resetToken.trim(), newPassword);
      setSuccessMessage(res.message);
      setStudentEmail(pendingEmail);
      setStudentPassword('');
      setStudentMode('login');
    } catch (err: any) {
      setError(err?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF4FD] via-[#F4F8FE] to-[#E9F1FC] flex items-center justify-center p-3 sm:p-4 lg:p-5 font-sans">
      {/* Centered Two-Column Responsive Layout: Unified Seamless Container with Zero Gap */}
      <div className="w-full max-w-[880px] lg:h-[570px] xl:h-[590px] bg-white rounded-3xl shadow-[0_16px_48px_rgba(16,42,86,0.10)] border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0 my-auto items-stretch">
        
        {/* ================= 1. LEFT BOX: DEDICATED ARTWORK CARD ================= */}
        <div className="w-full h-full min-h-[380px] sm:min-h-[460px] lg:min-h-0 bg-[#F7FAFD] overflow-hidden relative p-0 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-100">
          <img
            src={USER_ARTWORK_IMAGE_URL}
            onError={(e) => {
              e.currentTarget.src =
                'https://res.cloudinary.com/fi4r80wz/image/upload/v1793374381/Picsart_26-10-30_21-00-45-909.jpg_joebuu.jpg';
            }}
            alt="Front-Page Flip - Your notes. One place."
            className="w-full h-full object-cover object-[center_42%] select-none pointer-events-none"
            loading="eager"
          />
        </div>

        {/* ================= 2. RIGHT BOX: AUTHENTICATION CARD ================= */}
        <div className="w-full h-full min-h-[480px] lg:min-h-0 bg-white p-6 sm:p-7 lg:p-8 flex flex-col justify-center overflow-y-auto">
          <div className="w-full max-w-[345px] mx-auto my-auto flex flex-col justify-center py-1 sm:py-2">
            
            {/* TOP HEADING */}
            <div className="text-center mb-3 sm:mb-4">
              <h2 className="text-[25px] sm:text-[27px] font-black text-[#0F264C] tracking-tight leading-snug">
                Welcome back!
              </h2>
              <p className="text-xs sm:text-[13px] text-[#64748B] mt-1 font-normal">
                Sign in to continue your learning journey.
              </p>
            </div>

            {/* SWITCHING TABS: [ Login as Student ] [ Login as Admin ] as in Image 2 & 3 */}
            <div className="p-1 bg-[#F1F5F9] border border-slate-200/90 rounded-2xl grid grid-cols-2 gap-1 mb-3.5">
              {/* Login as Student: Active in Image 3 (white background, blue text/icon), Inactive in Image 2 (transparent, dark text/icon) */}
              <button
                type="button"
                onClick={() => {
                  setActiveRole('student');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 px-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeRole === 'student'
                    ? 'bg-white text-[#0066FF] shadow-xs border border-slate-200/70'
                    : 'bg-transparent text-[#234268] hover:text-[#0F264C]'
                }`}
              >
                <GraduationCap className={`w-4 h-4 shrink-0 ${activeRole === 'student' ? 'text-[#0066FF]' : 'text-[#234268]'}`} />
                <span className="tracking-normal">Login as Student</span>
              </button>

              {/* Login as Admin: Active in Image 2 (dark navy background, white text, green icon), Inactive in Image 3 (transparent, dark text, green icon) */}
              <button
                type="button"
                onClick={() => {
                  setActiveRole('admin');
                  setError(null);
                  setSuccessMessage(null);
                  if (!adminEmail) setAdminEmail('arkaparna.ds@gmail.com');
                }}
                className={`py-2 px-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeRole === 'admin'
                    ? 'bg-[#0B2548] text-white shadow-xs border border-[#0B2548]'
                    : 'bg-transparent text-[#234268] hover:text-[#0F264C]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#00C48C]" />
                <span className="tracking-normal">Login as Admin</span>
              </button>
            </div>

            {/* Error or Success Feedback Banners */}
            {error && (
              <div className="mb-2.5 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-2.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            {/* ================= A. LOGIN AS ADMIN TAB ================= */}
            {activeRole === 'admin' && (
              <div className="space-y-2.5">
                {/* Authorized Creator Portal Badge */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Authorized Creator Portal</span>
                  </div>
                </div>

                {/* Strict Creator Access Alert */}
                <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-0.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Strict Creator Access</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-amber-800 leading-relaxed font-normal">
                    Restricted strictly to <span className="font-bold text-amber-950">arkaparna.ds@gmail.com</span>. Public administrator registration is permanently disabled.
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Administrator Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="arkaparna.ds@gmail.com"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 outline-hidden font-normal text-[#0F172A] placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Administrator Passphrase
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter master passphrase"
                        className="w-full pl-9 pr-9 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 outline-hidden font-normal text-[#0F172A] placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 bg-[#0B2548] hover:bg-[#071931] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                  </button>
                </form>

                {/* Auto-fill demo passphrase link */}
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminEmail('arkaparna.ds@gmail.com');
                      setAdminPassword('Admin123!');
                    }}
                    className="text-xs text-[#7C3AED] hover:text-[#6D28D9] hover:underline font-semibold cursor-pointer"
                  >
                    Auto-fill Creator Demo Passphrase
                  </button>
                </div>
              </div>
            )}

            {/* ================= B. LOGIN AS STUDENT TAB ================= */}
            {activeRole === 'student' && (
              <>
                {/* 1A. STUDENT LOGIN (Matching Image 1) */}
                {studentMode === 'login' && (
                  <div className="space-y-2.5">
                    {/* Social Login Buttons */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        disabled={loading}
                        className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-[13px] font-medium text-slate-700 flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
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
                        className="w-full py-2 px-3 bg-[#101C34] hover:bg-[#0A1324] text-white rounded-xl text-xs sm:text-[13px] font-medium flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
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

                    {/* OR Divider */}
                    <div className="relative my-2 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <span className="relative px-2.5 bg-white text-[11px] text-slate-400 font-semibold tracking-wider uppercase">
                        OR
                      </span>
                    </div>

                    {/* Email & Password Form */}
                    <form onSubmit={handleStudentLogin} className="space-y-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full pl-9 pr-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 outline-hidden font-normal text-[#0F172A] placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showStudentPassword ? 'text' : 'password'}
                            required
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full pl-9 pr-9 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 outline-hidden font-normal text-[#0F172A] placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowStudentPassword(!showStudentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="mt-1 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setPendingEmail(studentEmail);
                              setError(null);
                              setSuccessMessage(null);
                              setStudentMode('forgot');
                            }}
                            className="text-xs text-[#1677FF] hover:underline font-medium cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-semibold text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </button>
                    </form>

                    {/* Sign up prompt */}
                    <div className="pt-1 text-center text-xs text-slate-600">
                      <span>Don't have an account? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSuccessMessage(null);
                          setStudentMode('register');
                        }}
                        className="text-[#1677FF] font-semibold hover:underline cursor-pointer"
                      >
                        Sign up
                      </button>
                    </div>
                  </div>
                )}

                {/* 1B. STUDENT REGISTRATION */}
                {studentMode === 'register' && (
                  <form onSubmit={handleStudentRegister} className="space-y-2">
                    <div className="text-center mb-1">
                      <h3 className="text-base font-bold text-[#102A56]">Create Student Account</h3>
                      <p className="text-xs text-[#64748B]">Fill in your details to register</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] outline-hidden font-normal"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] outline-hidden font-normal"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showStudentPassword ? 'text' : 'password'}
                          required
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full pl-9 pr-9 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] outline-hidden font-normal"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStudentPassword(!showStudentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          className="w-full pl-9 pr-9 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] outline-hidden font-normal"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Creating account...' : 'Register & Send Verification Email'}
                    </button>

                    <div className="pt-1 text-center text-xs text-slate-600">
                      <span>Already have an account? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSuccessMessage(null);
                          setStudentMode('login');
                        }}
                        className="text-[#1677FF] font-semibold hover:underline cursor-pointer"
                      >
                        Sign in
                      </button>
                    </div>
                  </form>
                )}

                {/* 1C. EMAIL VERIFICATION MODE */}
                {studentMode === 'verify' && (
                  <div className="text-center space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-[#102A56]">Verify Your Email</h3>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Code sent via Brevo to <span className="font-bold text-[#102A56]">{pendingEmail}</span>
                      </p>
                    </div>

                    <form onSubmit={handleVerifySubmit} className="space-y-3">
                      <div className="flex justify-center gap-1.5 sm:gap-2">
                        {verifyDigits.map((digit, index) => (
                          <input
                            key={index}
                            id={`digit-${index}`}
                            type="text"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleDigitChange(index, e.target.value)}
                            className="w-9 sm:w-10 h-11 sm:h-12 text-center text-lg font-bold text-[#102A56] bg-white border border-slate-300 rounded-xl focus:border-[#1677FF] focus:ring-1 focus:ring-[#1677FF]/20 outline-hidden font-mono"
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? 'Verifying...' : 'Verify Code & Sign In'}
                      </button>
                    </form>

                    <div className="text-center text-xs text-[#64748B] flex flex-col gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={loading || resendCooldown > 0}
                        className="text-[#1677FF] font-semibold hover:underline disabled:text-slate-400 disabled:no-underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>
                          {resendCooldown > 0
                            ? `Resend code in ${resendCooldown}s`
                            : 'Resend verification code'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSuccessMessage(null);
                          setStudentMode('login');
                        }}
                        className="text-slate-400 hover:text-slate-600 font-medium inline-flex items-center justify-center gap-1 cursor-pointer text-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Sign In</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 1D. FORGOT PASSWORD MODE */}
                {studentMode === 'forgot' && (
                  <form onSubmit={handleForgotPassword} className="space-y-2.5">
                    <div className="text-center mb-1">
                      <h3 className="text-base font-bold text-[#102A56]">Reset Password</h3>
                      <p className="text-xs text-[#64748B] mt-0.5">Enter your email for recovery instructions</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={pendingEmail}
                          onChange={(e) => setPendingEmail(e.target.value)}
                          placeholder="Enter your registered email"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] outline-hidden font-normal"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Sending...' : 'Send Recovery Code via Brevo'}
                    </button>

                    <div className="text-center text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSuccessMessage(null);
                          setStudentMode('login');
                        }}
                        className="text-[#1677FF] font-semibold hover:underline cursor-pointer"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </form>
                )}

                {/* 1E. RESET PASSWORD MODE */}
                {studentMode === 'reset' && (
                  <form onSubmit={handleResetPassword} className="space-y-2">
                    <div className="text-center mb-1">
                      <h3 className="text-base font-bold text-[#102A56]">Enter New Password</h3>
                      <p className="text-xs text-[#64748B] mt-0.5">Enter the code from your Brevo email</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Recovery Code</label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={resetToken}
                          onChange={(e) => setResetToken(e.target.value)}
                          placeholder="e.g. 582910"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] outline-hidden font-mono font-bold tracking-wider"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full pl-9 pr-9 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] outline-hidden font-normal"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full pl-9 pr-9 py-2 text-xs sm:text-[13px] bg-white border border-slate-200 rounded-xl focus:border-[#1677FF] outline-hidden font-normal"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Updating password...' : 'Update Password & Sign In'}
                    </button>

                    <div className="text-center text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setSuccessMessage(null);
                          setStudentMode('login');
                        }}
                        className="text-[#1677FF] font-semibold hover:underline cursor-pointer"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
