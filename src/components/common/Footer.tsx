import React, { useState } from 'react';
import {
  Mail,
  MapPin,
  Linkedin,
  Instagram,
  ExternalLink,
  X,
  ShieldCheck,
  FileText,
  CreditCard,
  Sparkles,
  Crown,
  BookOpen,
} from 'lucide-react';
import { User } from '../../types';

// =========================================================================
// Social Media Configuration
// To connect your official social profiles, insert your URLs here:
// =========================================================================
export const SOCIAL_LINKS = {
  // Insert your official LinkedIn profile or page URL:
  linkedin: (import.meta as any).env?.VITE_LINKEDIN_URL || '',
  // Insert your official Instagram profile URL:
  instagram: (import.meta as any).env?.VITE_INSTAGRAM_URL || '',
};

interface FooterProps {
  currentUser?: User | null;
  onNavigate: (tab: string, extra?: any) => void;
}

type PolicyType = 'how-it-works' | 'refund-policy' | 'privacy-policy' | 'terms-conditions' | null;

export const Footer: React.FC<FooterProps> = ({ currentUser, onNavigate }) => {
  const [activeModal, setActiveModal] = useState<PolicyType>(null);

  const handleSocialClick = (platform: 'linkedin' | 'instagram', e: React.MouseEvent) => {
    const url = SOCIAL_LINKS[platform];
    if (!url) {
      e.preventDefault();
      alert(
        `Your official ${platform === 'linkedin' ? 'LinkedIn' : 'Instagram'} profile URL can be configured in "src/components/common/Footer.tsx" under SOCIAL_LINKS or via the VITE_${platform.toUpperCase()}_URL environment variable.`
      );
    }
  };

  return (
    <>
      <footer className="bg-white border-t border-[#E2E8F0] mt-16 pt-12 pb-8 text-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main 4-Column Responsive Grid (Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10">
            {/* 1. Branding & Overview */}
            <div className="flex flex-col items-start space-y-3.5">
              <div
                onClick={() => onNavigate('home')}
                className="cursor-pointer inline-flex items-center select-none transition-transform duration-200 hover:scale-102"
                title="Front-Page Flip - Home"
              >
                <img
                  src="https://res.cloudinary.com/fi4r80wz/image/upload/v1792825222/fpf_logo_99_spkx2y.png"
                  alt="Front-Page Flip"
                  className="h-20 sm:h-[88px] w-auto object-contain"
                  loading="lazy"
                />
              </div>

              <p className="text-sm font-bold text-[#102A56] tracking-tight">
                Your learning resources, all in one place.
              </p>

              <p className="text-xs text-[#64748B] leading-relaxed max-w-sm">
                Explore educational PDFs, organize your favorite resources, and learn at your own pace.
              </p>
            </div>

            {/* 2. Quick Links */}
            <div className="flex flex-col space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A56]">
                Quick Links
              </h3>
              <ul className="space-y-2 text-xs font-semibold text-[#475569]">
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('home')}
                    className="hover:text-[#1677FF] transition-colors py-1 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Home</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('subjects')}
                    className="hover:text-[#1677FF] transition-colors py-1 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Explore Subjects</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('my-library', { subTab: 'favorites' })}
                    className="hover:text-[#1677FF] transition-colors py-1 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Favorites</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('my-library', { subTab: 'read-later' })}
                    className="hover:text-[#1677FF] transition-colors py-1 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Read Later</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('about')}
                    className="hover:text-[#1677FF] transition-colors py-1 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>About Us</span>
                  </button>
                </li>
                <li>
                  <a
                    href="mailto:frontpageflipofficial@gmail.com"
                    className="hover:text-[#1677FF] transition-colors py-1 cursor-pointer inline-flex items-center gap-1.5 text-[#1677FF]"
                    title="Send an email to Front-Page Flip"
                  >
                    <span>Contact Us</span>
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </li>
              </ul>
            </div>

            {/* 3. Support & Information */}
            <div className="flex flex-col space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A56]">
                Support & Information
              </h3>
              <ul className="space-y-2 text-xs font-semibold text-[#475569]">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('how-it-works')}
                    className="hover:text-[#1677FF] transition-colors py-1 cursor-pointer text-left"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('golden')}
                    className="hover:text-amber-600 transition-colors py-1 cursor-pointer text-left flex items-center gap-1.5 text-amber-700 font-bold"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Membership / Premium</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('refund-policy')}
                    className="hover:text-[#1677FF] transition-colors py-1 cursor-pointer text-left"
                  >
                    Payment & Refund Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('privacy-policy')}
                    className="hover:text-[#1677FF] transition-colors py-1 cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('terms-conditions')}
                    className="hover:text-[#1677FF] transition-colors py-1 cursor-pointer text-left"
                  >
                    Terms & Conditions
                  </button>
                </li>
              </ul>
            </div>

            {/* 4. Contact Information & Social Media */}
            <div className="flex flex-col space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A56]">
                Get in Touch
              </h3>

              <div className="space-y-2 text-xs text-[#475569]">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    Official Email
                  </span>
                  <a
                    href="mailto:frontpageflipofficial@gmail.com"
                    className="text-xs font-semibold text-[#1677FF] hover:underline inline-flex items-center gap-1.5 break-all"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>frontpageflipofficial@gmail.com</span>
                  </a>
                </div>

                <div className="pt-1">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    Location
                  </span>
                  <p className="font-medium text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00A88F] shrink-0" />
                    <span>Kolkata, India</span>
                  </p>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="pt-2">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Connect With Us
                </span>
                <div className="flex items-center gap-2.5">
                  {/* LinkedIn */}
                  <a
                    href={SOCIAL_LINKS.linkedin || '#'}
                    target={SOCIAL_LINKS.linkedin ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={(e) => handleSocialClick('linkedin', e)}
                    aria-label="Visit Front-Page Flip on LinkedIn"
                    title={
                      SOCIAL_LINKS.linkedin
                        ? 'Front-Page Flip on LinkedIn'
                        : 'Connect on LinkedIn (Configure URL in Footer.tsx)'
                    }
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#0077B5]/10 text-slate-600 hover:text-[#0077B5] border border-slate-200 hover:border-[#0077B5]/30 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                  >
                    <Linkedin className="w-4 h-4 fill-current" />
                  </a>

                  {/* Instagram */}
                  <a
                    href={SOCIAL_LINKS.instagram || '#'}
                    target={SOCIAL_LINKS.instagram ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={(e) => handleSocialClick('instagram', e)}
                    aria-label="Visit Front-Page Flip on Instagram"
                    title={
                      SOCIAL_LINKS.instagram
                        ? 'Front-Page Flip on Instagram'
                        : 'Connect on Instagram (Configure URL in Footer.tsx)'
                    }
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#E4405F]/10 text-slate-600 hover:text-[#E4405F] border border-slate-200 hover:border-[#E4405F]/30 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle Horizontal Divider */}
          <div className="border-t border-[#E2E8F0] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <p>© 2026 Front-Page Flip. All rights reserved.</p>

            <div className="flex items-center gap-4">
              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="text-purple-600 hover:text-purple-700 font-bold transition-colors cursor-pointer"
                >
                  Admin Dashboard
                </button>
              )}
              <span className="text-slate-400">•</span>
              <a
                href="mailto:frontpageflipofficial@gmail.com"
                className="hover:text-[#1677FF] transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Support & Policy Modal Dialog */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto space-y-4 text-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                {activeModal === 'how-it-works' && <BookOpen className="w-5 h-5 text-[#1677FF]" />}
                {activeModal === 'refund-policy' && <CreditCard className="w-5 h-5 text-amber-500" />}
                {activeModal === 'privacy-policy' && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
                {activeModal === 'terms-conditions' && <FileText className="w-5 h-5 text-purple-500" />}
                <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
                  {activeModal === 'how-it-works' && 'How Front-Page Flip Works'}
                  {activeModal === 'refund-policy' && 'Payment & Refund Policy'}
                  {activeModal === 'privacy-policy' && 'Privacy Policy'}
                  {activeModal === 'terms-conditions' && 'Terms & Conditions'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="text-xs sm:text-sm leading-relaxed space-y-3.5 text-slate-600">
              {activeModal === 'how-it-works' && (
                <>
                  <p>
                    <strong className="text-slate-800">Front-Page Flip</strong> is an academic PDF repository designed to give university and school students a distraction-free, verified learning experience.
                  </p>
                  <div className="space-y-2 pt-1">
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                      <h4 className="font-bold text-[#102A56] mb-1">1. Verified Curriculum Notes</h4>
                      <p className="text-xs">
                        All study materials and PDFs are uploaded, curated, and validated by our academic administrators to eliminate incorrect or misleading content.
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <h4 className="font-bold text-[#102A56] mb-1">2. Online PDF Reader & Progress</h4>
                      <p className="text-xs">
                        Read lecture slides and notes directly inside our high-performance viewer. Your reading progress, favorites, and read-later list are synchronized to your account.
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                      <h4 className="font-bold text-[#102A56] mb-1">3. Lifetime Golden Membership</h4>
                      <p className="text-xs">
                        Upgrade anytime for ₹1 one-time to unlock unlimited offline PDF downloads for all current and future educational materials.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'refund-policy' && (
                <>
                  <p>
                    We offer a single, transparent digital membership: <strong className="text-slate-800">Lifetime Golden Membership</strong> priced at a one-time payment of <strong className="text-slate-800">₹1</strong>.
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li>
                      <strong>Instant Digital Delivery:</strong> Upon successful verification of your payment signature via Razorpay, your student account is immediately upgraded to Lifetime Golden status.
                    </li>
                    <li>
                      <strong>Transaction Support:</strong> If money has been debited from your bank account or UPI but your Golden status was not automatically activated due to a network interruption, our system auto-reconciles within 24 hours.
                    </li>
                    <li>
                      <strong>Refund Requests:</strong> Because Lifetime Golden grants instant and permanent access to digital downloads, refund requests are reviewed on a case-by-case basis for accidental duplicate payments.
                    </li>
                  </ul>
                  <p className="text-xs pt-2">
                    For assistance with any transaction, please write to us at{' '}
                    <a href="mailto:frontpageflipofficial@gmail.com" className="text-[#1677FF] font-semibold underline">
                      frontpageflipofficial@gmail.com
                    </a>{' '}
                    with your Razorpay payment ID and account email.
                  </p>
                </>
              )}

              {activeModal === 'privacy-policy' && (
                <>
                  <p>
                    Your privacy and data security are core tenets of Front-Page Flip. We do not sell, rent, or monetize your personal information.
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li>
                      <strong>Data Collected:</strong> We collect only necessary account information: your name, email address, and encrypted credentials.
                    </li>
                    <li>
                      <strong>Security & Passwords:</strong> Passwords are never stored in plain text; they are secured using industry-standard BCrypt hashing with unique cryptographic salts.
                    </li>
                    <li>
                      <strong>Session Management:</strong> Authentication is handled via signed JSON Web Tokens (JWT). Sessions expire automatically.
                    </li>
                    <li>
                      <strong>Payment Information:</strong> We do not store credit card or debit card numbers on our servers. All payment processing is securely managed by Razorpay.
                    </li>
                  </ul>
                </>
              )}

              {activeModal === 'terms-conditions' && (
                <>
                  <p>
                    By accessing or using Front-Page Flip, you agree to comply with our Terms of Service:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li>
                      <strong>Academic Use:</strong> All educational materials on Front-Page Flip are provided strictly for personal learning, revision, and academic reference.
                    </li>
                    <li>
                      <strong>Intellectual Property:</strong> Uploaded materials remain the intellectual property of their respective creators and institutions. Commercial redistribution or mass re-selling is strictly prohibited.
                    </li>
                    <li>
                      <strong>Account Responsibility:</strong> You are responsible for maintaining the confidentiality of your student credentials.
                    </li>
                    <li>
                      <strong>Fair Usage:</strong> Automated scraping, botting, or attempting to compromise platform security or endpoints will result in immediate account termination.
                    </li>
                  </ul>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
