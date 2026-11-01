import React, { useState } from 'react';
import {
  ShieldAlert,
  FileCheck2,
  Bot,
  Sparkles,
  BookOpen,
  Users,
  Search,
  Bookmark,
  Send,
  HelpCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { Logo } from '../common/Logo';

interface AboutPageProps {
  onNavigate: (tab: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  // Filo AI Assistant interactive state
  const [filoQuery, setFiloQuery] = useState('');
  const [filoMessages, setFiloMessages] = useState<Array<{ sender: 'user' | 'filo'; text: string; time: string }>>([
    {
      sender: 'filo',
      text: 'Hi there! I am Filo, your dedicated Front-Page Flip AI study assistant. If you have any problem or question related to any subject or study notes, just ask me!',
      time: 'Just now',
    },
  ]);
  const [isFiloThinking, setIsFiloThinking] = useState(false);

  const handleAskFilo = (e: React.FormEvent) => {
    e.preventDefault();
    const query = filoQuery.trim();
    if (!query) return;

    const userMsg = {
      sender: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setFiloMessages((prev) => [...prev, userMsg]);
    setFiloQuery('');
    setIsFiloThinking(true);

    setTimeout(() => {
      let reply = '';
      const lower = query.toLowerCase();

      if (lower.includes('upload') || lower.includes('add pdf') || lower.includes('edit')) {
        reply =
          'Regarding uploads: Under our Security Policy, students cannot create, edit, delete, or upload subjects or PDFs. All administrative endpoints require verified administrator privileges to keep all materials academically verified.';
      } else if (lower.includes('video') || lower.includes('quiz') || lower.includes('media')) {
        reply =
          'Front-Page Flip accepts strictly validated educational PDF notes. No video links, online quizzes, or unrelated media can be added, ensuring a pure, distraction-free study environment.';
      } else if (lower.includes('math') || lower.includes('calculus') || lower.includes('algebra')) {
        reply =
          'For Mathematics, check out our curated subjects under "Subjects" -> "Mathematics". You can find comprehensive lecture notes, problem sets, and formula cheat sheets!';
      } else if (lower.includes('cs') || lower.includes('computer') || lower.includes('data structure') || lower.includes('algorithm')) {
        reply =
          'Computer Science materials include complete lecture notes on Data Structures & Algorithms, Database Systems, Operating Systems, and Web Engineering. Check the Subjects tab!';
      } else if (lower.includes('physics') || lower.includes('chemistry') || lower.includes('science')) {
        reply =
          'Our Science repository contains detailed notes for Classical Mechanics, Electromagnetism, Organic Chemistry, and Thermodynamics with step-by-step derivations.';
      } else {
        reply = `Great question about "${query}"! You can explore all verified notes for this topic in the "Browse PDFs" section or search by keywords in the search bar above. If you need any specific subject curriculum guide, I'm here to help!`;
      }

      setFiloMessages((prev) => [
        ...prev,
        {
          sender: 'filo',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsFiloThinking(false);
    }, 650);
  };

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

      {/* 2. Three Mandatory Security & Platform Policies (Requested by User) */}
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
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-red-600 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Enforced by Spring Boot RBAC &amp; JWT</span>
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
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-[#0066FF] font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Cloudinary Raw Storage &amp; Magic-Byte Verification</span>
            </div>
          </div>

          {/* Policy Card 3: Subject Help & Filo AI Assistant */}
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
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-[#00A88F] font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Available 24/7 for Student Queries</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Filo AI Assistant Section */}
      <section className="mb-12 bg-gradient-to-br from-[#F0FDFB] via-white to-[#F4F9FF] rounded-3xl border border-[#B2ECE4] p-6 sm:p-8 md:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00A88F] to-[#00E5C0] text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-[#0F264C]">Ask Filo — AI Assistant</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Ask any question about subjects, notes, academic topics, or platform policies.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold bg-white px-3.5 py-1.5 rounded-full border border-slate-200">
            <HelpCircle className="w-4 h-4 text-[#00A88F]" />
            <span>Instant Subject Resolution</span>
          </div>
        </div>

        {/* Filo Chat Messages Container */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 h-64 overflow-y-auto space-y-3 mb-4">
          {filoMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'filo' && (
                <div className="w-7 h-7 rounded-lg bg-[#00A88F] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  F
                </div>
              )}
              <div
                className={`max-w-xl rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-[#0066FF] text-white font-medium rounded-br-xs'
                    : 'bg-[#F1F8F7] text-slate-800 font-normal border border-[#D0F0EB] rounded-bl-xs'
                }`}
              >
                <p>{msg.text}</p>
                <span
                  className={`block text-[10px] mt-1 text-right ${
                    msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {isFiloThinking && (
            <div className="flex items-center gap-2 text-xs text-[#00A88F] font-semibold">
              <Bot className="w-4 h-4 animate-spin text-[#00A88F]" />
              <span>Filo is typing...</span>
            </div>
          )}
        </div>

        {/* Filo Query Input Bar */}
        <form onSubmit={handleAskFilo} className="flex items-center gap-2">
          <input
            type="text"
            value={filoQuery}
            onChange={(e) => setFiloQuery(e.target.value)}
            placeholder="Ask Filo anything about subjects, topics, or Front-Page Flip policies..."
            className="flex-1 py-3 px-4 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00A88F] focus:ring-1 focus:ring-[#00A88F]"
          />
          <button
            type="submit"
            disabled={!filoQuery.trim()}
            className="px-5 py-3 bg-[#00A88F] hover:bg-[#008f7a] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </section>

      {/* 4. Platform Specifications & Architecture */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs">
        <h3 className="text-xl sm:text-2xl font-black text-[#0F264C] tracking-tight mb-2">
          Technical Architecture &amp; Reliability
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mb-6">
          Engineered for university-scale student traffic with high reliability and low latency.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Database</h4>
            <p className="text-sm font-bold text-[#0F264C]">Aiven Cloud MySQL</p>
            <p className="text-xs text-slate-600 mt-1">
              Encrypted SSL/TLS storage of student accounts, library bookmarks, and metadata.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">PDF Storage</h4>
            <p className="text-sm font-bold text-[#0F264C]">Cloudinary Raw Assets</p>
            <p className="text-xs text-slate-600 mt-1">
              Dedicated cloud bucket storing raw PDF streams with secure CDN delivery.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Backend Engine</h4>
            <p className="text-sm font-bold text-[#0F264C]">Spring Boot 3.3.4</p>
            <p className="text-xs text-slate-600 mt-1">
              Java 21 secure microservice with strict JWT role validation on Render.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Frontend Client</h4>
            <p className="text-sm font-bold text-[#0F264C]">React &amp; Tailwind CSS</p>
            <p className="text-xs text-slate-600 mt-1">
              Responsive modern UI with instant search, interactive reader, and local progress sync.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
