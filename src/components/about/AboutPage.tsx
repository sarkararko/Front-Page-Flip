import React from 'react';
import {
  ShieldAlert,
  FileCheck2,
  Bot,
  Sparkles,
  BookOpen,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface AboutPageProps {
  onNavigate: (tab: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F264C] via-[#102A56] to-[#0A3D4C] text-white p-8 sm:p-12 mb-10 shadow-lg">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00A88F]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#0066FF]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-[#00E5C0] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#00E5C0]" />
            <span>About Front-Page Flip Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            Your notes. <span className="text-[#00E5C0]">One place.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
            Front-Page Flip is an exclusive, PDF-only educational repository created to give students
            a pure, structured, and verified study experience. We believe high-quality education should
            be clean, rapid, and free of algorithmic noise.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => onNavigate('browse')}
              className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse All Notes</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('subjects')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Subjects</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Security & Quality Standards */}
      <section className="mb-12">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#009688] text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-[#00A88F]" />
            <span>Platform Governance &amp; Security Policy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F264C] tracking-tight">
            Our Quality &amp; Security Standards
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
            Front-Page Flip operates under strict academic guidelines to protect students from unverified content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Policy Card 1: Student Permissions & Admin Verification */}
          <div className="bg-white rounded-2xl border-2 border-red-100 hover:border-red-200 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-red-600">
                Security Policy 1
              </span>
              <h3 className="text-lg font-bold text-[#0F264C] mt-1 mb-2.5">
                Strict Administrative Control
              </h3>
              <p className="text-sm font-semibold text-slate-800 leading-snug bg-red-50/70 p-3 rounded-xl border border-red-100 mb-3">
                Students cannot create, edit, delete, or upload subjects and PDFs. All administrative endpoints require verified administrator privileges.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                To guarantee curriculum accuracy and eliminate fraudulent or low-grade materials, all modifications
                are restricted to authorized administrators with verified credentials.
              </p>
            </div>
          </div>

          {/* Policy Card 2: Validated Educational PDFs Only */}
          <div className="bg-white rounded-2xl border-2 border-blue-100 hover:border-blue-200 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#0066FF] flex items-center justify-center mb-4">
                <FileCheck2 className="w-6 h-6 text-[#0066FF]" />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#0066FF]">
                Policy 2
              </span>
              <h3 className="text-lg font-bold text-[#0F264C] mt-1 mb-2.5">
                PDF-Only Curriculum Standard
              </h3>
              <p className="text-sm font-semibold text-slate-800 leading-snug bg-blue-50/70 p-3 rounded-xl border border-blue-100 mb-3">
                Front-Page Flip accepts only validated educational PDF notes. No video links, online quizzes, or unrelated media can be added.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Front-Page Flip is intentionally designed for uninterrupted concentration. By omitting third-party
                video players and algorithmic ads, students stay in a focused study flow.
              </p>
            </div>
          </div>

          {/* Policy Card 3: Subject Help & Student Support */}
          <div className="bg-white rounded-2xl border-2 border-teal-100 hover:border-teal-200 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-[#00A88F] flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-[#00A88F]" />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#00A88F]">
                Support &amp; AI Guidance
              </span>
              <h3 className="text-lg font-bold text-[#0F264C] mt-1 mb-2.5">
                Filo, Your AI Study Assistant
              </h3>
              <p className="text-sm font-semibold text-slate-800 leading-snug bg-teal-50/70 p-3 rounded-xl border border-teal-100 mb-3">
                In case of any problem related to any subject, students can ask Filo, the AI assistant.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stuck on a challenging formula, theorem, or looking for specific lecture notes? Filo is available
                24/7 to guide you through topics, clarify concepts, and recommend notes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
