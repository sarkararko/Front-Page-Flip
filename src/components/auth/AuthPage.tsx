import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { AUTHORIZED_CREATOR_EMAIL } from '../../services/storage';
import { User } from '../../types';

export const USER_ARTWORK_IMAGE_URL =
  'https://res.cloudinary.com/fi4r80wz/image/upload/v1793374381/Picsart_26-10-30_21-00-45-909.jpg_joebuu.jpg';
export const USER_BACKGROUND_IMAGE_URL = USER_ARTWORK_IMAGE_URL;

interface AuthPageProps {
  onSuccess: (user: User) => void;
}

type RoleTab = 'student' | 'admin';
type StudentMode = 'login' | 'register' | 'verify' | 'forgot';

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
  const [adminEmail, setAdminEmail] = useState(AUTHORIZED_CREATOR_EMAIL);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Verification state (6 digits)
  const [verifyDigits, setVerifyDigits] = useState(['', '', '', '', '', '']);
  const [pendingEmail, setPendingEmail] = useState('');
  const [demoCodeHelper, setDemoCodeHelper] = useState('');

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    if (!studentEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.studentLogin(studentEmail.trim(), studentPassword);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate student account.');
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
      setDemoCodeHelper(res.verificationCode);
      setStudentMode('verify');
      setSuccessMessage(`A 6-digit verification code has been dispatched to ${studentEmail.trim()}`);
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Admin Login (Exclusively Creator: arkaparna.ds@gmail.com)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();

    if (cleanEmail !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      setError(
        `403 Forbidden: Access denied. Only the authorized creator account (${AUTHORIZED_CREATOR_EMAIL}) has administrator privileges.`
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.adminLogin(cleanEmail, adminPassword);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Administrator authentication failed. Verify passphrase.');
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
    <div className="min-h-screen bg-gradient-to-br from-[#EEF4FD] via-[#F4F8FE] to-[#E9F1FC] flex items-center justify-center p-3 sm:p-4 lg:p-5 font-sans">
      {/* Centered Two-Column Responsive Layout: Unified Seamless Container with Zero Gap */}
      <div className="w-full max-w-[880px] lg:h-[570px] xl:h-[590px] bg-white rounded-3xl shadow-[0_16px_48px_rgba(16,42,86,0.10)] border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0 my-auto items-stretch">
        
        {/* ================= 1. LEFT BOX: DEDICATED ARTWORK CARD ================= */}
        {/* Seamlessly connected to right box with zero gap, edge-to-edge artwork */}
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
        {/* Aligned together with left box, compact height to fit screen comfortably without scrolling */}
        <div className="w-full h-full min-h-[480px] lg:min-h-0 bg-white p-5 sm:p-6 lg:p-7 flex flex-col justify-center overflow-y-auto">
          <div className="w-full max-w-[370px] mx-auto my-auto flex flex-col justify-center py-1 sm:py-2">
            
            {/* BIG "Welcome back!" HEADING AT TOP */}
            <div className="text-center mb-4 sm:mb-4.5">
              <h2 className="text-[26px] sm:text-[30px] font-black text-[#0F264C] tracking-tight leading-tight">
                Welcome back!
              </h2>
              <p className="text-sm text-[#475569] mt-1 font-medium">
                Sign in to continue your learning journey.
              </p>
            </div>

            {/* EXACTLY TWO OPTIONS: Login as Student and Login as Admin */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-3.5 border border-slate-200/70">
              <button
                type="button"
                onClick={() => {
                  setActiveRole('student');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[13px] sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeRole === 'student'
                    ? 'bg-white text-[#1677FF] shadow-2xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Login as Student</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRole('admin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[13px] sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeRole === 'admin'
                    ? 'bg-[#102A56] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Login as Admin</span>
              </button>
            </div>

            {/* Error or Success Feedback Banners */}
            {error && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-[13px] font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-[13px] font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="leading-tight">{successMessage}</span>
              </div>
            )}

            {/* ================= 1. LOGIN AS STUDENT (Everything Currently Present) ================= */}
            {activeRole === 'student' && (
              <>
                {studentMode === 'login' && (
                  <>
                    {/* Social Login Buttons */}
                    <div className="space-y-2 mb-3">
                      {/* Continue with Google */}
                      <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        disabled={loading}
                        className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs sm:text-[13px] font-semibold text-[#152238] flex items-center justify-center gap-2.5 transition-colors shadow-2xs"
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

                      {/* Continue with GitHub */}
                      <button
                        type="button"
                        onClick={() => handleSocialLogin('github')}
                        disabled={loading}
                        className="w-full py-2 px-3 bg-[#101C34] hover:bg-[#0A1324] text-white rounded-xl text-xs sm:text-[13px] font-semibold flex items-center justify-center gap-2.5 transition-colors shadow-2xs"
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
                    <div className="relative my-2.5 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#E2E8F0]" />
                      </div>
                      <span className="relative px-2.5 bg-white text-xs text-[#64748B] font-bold tracking-wider uppercase">
                        OR
                      </span>
                    </div>

                    {/* Email & Password Form */}
                    <form onSubmit={handleStudentLogin} className="space-y-2.5">
                      <div>
                        <label className="block text-[13px] font-bold text-[#0F264C] mb-0.5">
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
                            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/20 outline-hidden font-medium text-[#0F172A] placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-bold text-[#0F264C] mb-0.5">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showStudentPassword ? 'text' : 'password'}
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full pl-9 pr-9 py-1.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/20 outline-hidden font-medium text-[#0F172A] placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowStudentPassword(!showStudentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showStudentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="mt-0.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setPendingEmail(studentEmail);
                              setStudentMode('forgot');
                            }}
                            className="text-xs text-[#1677FF] hover:underline font-semibold"
                          >
                            Forgot password?
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-1 py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-bold text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 tracking-wide"
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </button>
                    </form>

                    {/* Don't have an account? Sign up */}
                    <div className="mt-3 text-center text-xs sm:text-sm text-[#475569]">
                      <span>Don't have an account? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setStudentMode('register');
                        }}
                        className="text-[#1677FF] font-bold hover:underline"
                      >
                        Sign up
                      </button>
                    </div>
                  </>
                )}

                {/* Registration Mode */}
                {studentMode === 'register' && (
                  <div>
                    <h3 className="text-base font-bold text-[#102A56] mb-3 text-center">
                      Create Student Account
                    </h3>
                    <form onSubmit={handleStudentRegister} className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#102A56] mb-1">Full Name</label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] outline-hidden font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#102A56] mb-1">Email address</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            placeholder="student@university.edu"
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] outline-hidden font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#102A56] mb-1">Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showStudentPassword ? 'text' : 'password'}
                            required
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] outline-hidden font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowStudentPassword(!showStudentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showStudentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#102A56] mb-1">Confirm Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] outline-hidden font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-1.5 py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs"
                      >
                        {loading ? 'Creating account...' : 'Create Account'}
                      </button>
                    </form>

                    <div className="mt-3 text-center text-xs text-[#64748B]">
                      <span>Already have an account? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setStudentMode('login');
                        }}
                        className="text-[#1677FF] font-bold hover:underline"
                      >
                        Sign in
                      </button>
                    </div>
                  </div>
                )}

                {/* Verification Mode */}
                {studentMode === 'verify' && (
                  <div className="text-center">
                    <h3 className="text-base font-bold text-[#102A56] mb-1">
                      Verify Your Email
                    </h3>
                    <p className="text-[11px] text-[#64748B] mb-2 font-medium">
                      Code sent to <span className="font-bold text-[#102A56]">{pendingEmail}</span>
                    </p>
                    {demoCodeHelper && (
                      <div className="mb-3 inline-block px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-mono font-bold">
                        Code: {demoCodeHelper}
                      </div>
                    )}

                    <form onSubmit={handleVerifySubmit} className="space-y-4">
                      <div className="flex justify-center gap-2">
                        {verifyDigits.map((digit, index) => (
                          <input
                            key={index}
                            id={`digit-${index}`}
                            type="text"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleDigitChange(index, e.target.value)}
                            className="w-9 h-11 text-center text-lg font-bold text-[#102A56] bg-white border-2 border-[#CBD5E1] rounded-xl focus:border-[#1677FF] outline-hidden font-mono"
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs"
                      >
                        {loading ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </form>

                    <div className="mt-3 text-center text-xs text-[#64748B] flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={handleResendCode}
                        className="text-[#1677FF] font-bold hover:underline"
                      >
                        Resend code
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentMode('login')}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </div>
                )}

                {/* Forgot Password Mode */}
                {studentMode === 'forgot' && (
                  <div>
                    <h3 className="text-base font-bold text-[#102A56] mb-1 text-center">
                      Reset Password
                    </h3>
                    <p className="text-[11px] text-[#64748B] mb-3 text-center">
                      Enter your email to receive recovery instructions.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setSuccessMessage('Recovery code generated. Demo code is 123456.');
                        setStudentMode('verify');
                      }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block text-[11px] font-bold text-[#102A56] mb-1">Email address</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={pendingEmail}
                            onChange={(e) => setPendingEmail(e.target.value)}
                            placeholder="Enter your registered email"
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-xl focus:border-[#1677FF] outline-hidden font-medium"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs"
                      >
                        Send Recovery Code
                      </button>
                    </form>

                    <div className="mt-3 text-center text-xs">
                      <button
                        type="button"
                        onClick={() => setStudentMode('login')}
                        className="text-[#1677FF] font-bold hover:underline"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ================= 2. LOGIN AS ADMIN (Everything Currently Present) ================= */}
            {activeRole === 'admin' && (
              <div>
                <div className="mb-3 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Authorized Creator Portal</span>
                  </div>
                </div>

                <div className="mb-3.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-tight">
                  <p className="font-bold flex items-center gap-1 text-amber-950">
                    <Lock className="w-3 h-3 text-amber-600" />
                    Strict Creator Access
                  </p>
                  <p className="mt-0.5 text-amber-800">
                    Restricted strictly to <strong>{AUTHORIZED_CREATOR_EMAIL}</strong>. Public administrator registration is permanently disabled.
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-[13px] font-bold text-[#0F264C] mb-1">
                      Administrator Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder={AUTHORIZED_CREATOR_EMAIL}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-hidden font-medium text-[#0F172A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#0F264C] mb-1">
                      Administrator Passphrase
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter master passphrase"
                        className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 outline-hidden font-medium text-[#0F172A]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 bg-[#102A56] hover:bg-[#0B1E3D] text-white font-bold text-sm rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 tracking-wide"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                  </button>
                </form>

                <div className="mt-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminEmail(AUTHORIZED_CREATOR_EMAIL);
                      setAdminPassword('Admin@123');
                    }}
                    className="text-xs text-purple-600 hover:underline font-semibold"
                  >
                    Auto-fill Creator Demo Passphrase
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
