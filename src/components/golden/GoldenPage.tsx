import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  Download,
  Infinity,
  ShieldCheck,
  Zap,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Info,
  Lock,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { User } from '../../types';
import { ApiService } from '../../services/api';

interface GoldenPageProps {
  currentUser: User | null;
  fromPdfTitle?: string;
  onNavigate: (tab: string) => void;
  onBack?: () => void;
  onPaymentSuccess?: () => void;
}

export const GoldenPage: React.FC<GoldenPageProps> = ({
  currentUser,
  fromPdfTitle,
  onNavigate,
  onBack,
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAlreadyGolden = currentUser?.isGolden === true;

  // Ensure Razorpay SDK script is ready
  const ensureRazorpayLoaded = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        // In case it already finished loading
        setTimeout(() => resolve(!!(window as any).Razorpay), 1000);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // STEP 2: FRONTEND - Checkout trigger on Buy button click
  const handleBuyClick = async () => {
    if (isAlreadyGolden) {
      setSuccessMessage('You already have an active Lifetime Golden membership! All PDF downloads are permanently unlocked.');
      return;
    }

    if (!currentUser) {
      setErrorMessage('Please sign in to your student account first so your Lifetime Golden membership can be activated.');
      setTimeout(() => {
        onNavigate('profile');
      }, 1500);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Ensure Razorpay checkout.js is loaded
      const isLoaded = await ensureRazorpayLoaded();
      if (!isLoaded || !(window as any).Razorpay) {
        throw new Error('Unable to load Razorpay payment SDK. Please verify your internet connection and try again.');
      }

      // 2. Call backend endpoint to create order (amount: 100 paise = ₹1)
      const orderData = await ApiService.createRazorpayOrder(100);
      if (!orderData || !orderData.order_id) {
        throw new Error('Could not generate Razorpay order. Please try again.');
      }

      const keyId =
        orderData.key_id ||
        (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
        'rzp_live_TwReofbXIfEGXk';

      // 3. Open Razorpay Standard Checkout Modal
      const options = {
        key: keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'Front-Page Flip',
        description: 'Lifetime Golden — Unlock All PDF Downloads',
        image: 'https://cdn-icons-png.flaticon.com/512/2997/2997295.png',
        order_id: orderData.order_id,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          // STEP 3: Receive payment credentials and verify signature via backend
          setVerifying(true);
          try {
            const verifyRes = await ApiService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: currentUser?.id,
            });

            if (verifyRes.success) {
              setSuccessMessage(
                'Payment verified successfully! Payment ID: ' +
                  response.razorpay_payment_id +
                  '. Your Lifetime Golden membership is now active! All PDF downloads are unlocked.'
              );
              onPaymentSuccess?.();
            } else {
              setErrorMessage('Signature verification was rejected. Please contact support if amount was deducted.');
            }
          } catch (vErr: any) {
            setErrorMessage(vErr?.message || 'Payment signature verification failed. Please try again.');
          } finally {
            setVerifying(false);
            setLoading(false);
          }
        },
        prefill: {
          name: currentUser?.name || 'Student',
          email: currentUser?.email || '',
        },
        notes: {
          package: 'Lifetime Golden',
          userId: currentUser?.id || 'guest',
        },
        theme: {
          color: '#F59E0B', // Premium gold accent
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setErrorMessage('Payment canceled. You can complete your Lifetime Golden upgrade anytime.');
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);

      // Handle payment.failed event
      rzpInstance.on('payment.failed', function (failResp: any) {
        console.error('Razorpay payment failed:', failResp);
        const desc = failResp?.error?.description || failResp?.error?.reason || 'Transaction could not be completed.';
        setErrorMessage(`Payment Failed: ${desc}`);
        setLoading(false);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err?.message || 'Failed to start payment checkout.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-slate-50 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation / Back */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack || (() => onNavigate('home'))}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Study Materials</span>
          </button>

          {isAlreadyGolden && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lifetime Golden Active</span>
            </span>
          )}
        </div>

        {/* Redirect context notice if navigated from PDF reader download button */}
        {fromPdfTitle && !isAlreadyGolden && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold">PDF Downloads require Golden: </span>
              Downloading <span className="font-semibold italic">"{fromPdfTitle}"</span> and all
              other study materials requires Lifetime Golden membership.
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold uppercase tracking-wider mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
            <span>Front-Page Flip Golden Membership</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Front-Page Flip <span className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">Golden</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Upgrade your learning experience with unrestricted, permanent offline access to every curriculum PDF, syllabus guide, and exam revision note.
          </p>
        </div>

        {/* Purchase Card */}
        <div className="relative bg-white rounded-3xl shadow-xl border-2 border-amber-300/80 overflow-hidden mb-12">
          {/* Top Golden accent ribbon */}
          <div className="h-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

          <div className="p-6 sm:p-10 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-md border border-amber-200 mb-2">
                  <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  <span>PREMIUM</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Lifetime Golden
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-md">
                  Unlock PDF downloads for all study materials, permanently.
                </p>
              </div>

              {/* Price Display */}
              <div className="text-left md:text-right shrink-0 bg-gradient-to-br from-amber-50/80 to-yellow-50/50 p-5 rounded-2xl border border-amber-200/80">
                <div className="text-xs uppercase tracking-wider font-extrabold text-amber-800">
                  One-Time Payment
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900">₹1</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">only</span>
                </div>
                <div className="text-[11px] font-bold text-amber-700 mt-1 flex items-center md:justify-end gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>No monthly subscriptions • Pay once, own forever</span>
                </div>
              </div>
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 flex items-start gap-3 animate-fade-in shadow-xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm font-medium">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Success Notification Banner */}
            {successMessage && (
              <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-3 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm font-medium">
                  {successMessage}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              {isAlreadyGolden ? (
                <div className="w-full sm:w-auto flex-1 py-4 px-8 rounded-xl font-black text-base text-emerald-900 bg-emerald-100 border border-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Lifetime Golden Active — PDF Downloads Unlocked</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleBuyClick}
                  disabled={loading || verifying}
                  className="w-full sm:w-auto flex-1 py-4 px-8 rounded-xl font-black text-base sm:text-lg text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-600 shadow-lg shadow-amber-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                      <span>Verifying Signature...</span>
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                      <span>Opening Razorpay Checkout...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 fill-slate-950 text-slate-950" />
                      <span>Buy Golden — ₹1</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onBack || (() => onNavigate('home'))}
                className="w-full sm:w-auto py-4 px-6 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Continue Free Reading
              </button>
            </div>

            <div className="mt-4 flex items-center text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Secured by Razorpay</span>
              </span>
            </div>

            {/* Value Proposition Grid */}
            <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <Download className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Unlimited PDF Downloads
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Download complete, original high-resolution PDFs across all present and future subjects.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <Infinity className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Permanent Lifetime Validity
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Single one-time payment. Never expires. No recurring bills, no annual fees, ever.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    All Subjects Included
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Spring Boot, Operating Systems, Computer Networks, Interview Prep, and all new additions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <Zap className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Offline Study Anywhere
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Save PDFs to your laptop, tablet, or mobile phone for study without internet connectivity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Free vs Golden Comparison Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Compare Student Plans
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Both free and Golden students have full online reading access.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-700 font-bold">
                  <th className="py-3 px-4 sm:px-6">Feature</th>
                  <th className="py-3 px-4 text-center">Student (Free)</th>
                  <th className="py-3 px-4 text-center text-amber-900 bg-amber-50/80">Lifetime Golden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                <tr>
                  <td className="py-3 px-4 sm:px-6">Explore Subjects &amp; Catalogs</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-amber-50/30">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6">In-Browser Original PDF Reader</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-amber-50/30">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6">Reading Progress &amp; Bookmarks</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-amber-50/30">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6 font-semibold text-slate-900">Offline Original PDF Downloads</td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                      <Lock className="w-3.5 h-3.5" />
                      Locked
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-700 bg-amber-50/50">
                    ✓ Unlimited Downloads
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 sm:px-6">Access Across All Subjects</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Online Only</td>
                  <td className="py-3 px-4 text-center font-bold text-amber-700 bg-amber-50/50">
                    ✓ Online &amp; Offline
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Authenticity Guarantee */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Authentic university &amp; academic study notes published directly by verified administrators.</span>
        </div>
      </div>
    </div>
  );
};
