import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, ArrowLeft, Target, ShieldCheck, Cpu, Flame, Database, CheckCircle } from 'lucide-react';

export const About = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-slate-900">DsArena</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <h1 className="text-3xl font-extrabold mb-4">About DsArena</h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-8">
          DsArena is an engineering-grade academic & competitive programming telemetry platform designed for colleges,
          universities, and software engineering training cohorts. It aggregates and visualizes student coding metrics
          across LeetCode and GeeksforGeeks without requiring student passwords.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-white border border-orange-100 shadow-sm">
            <Target className="w-6 h-6 text-orange-500 mb-3" />
            <h3 className="text-base font-bold mb-2">Cohort Tracking (Batches)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Supports foundational, intermediate, and advanced batches (Alpha, Beta, Gamma) as well as custom cohorts.
              Instructors can monitor batch-specific average problems solved and individual streak consistency.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-orange-100 shadow-sm">
            <Cpu className="w-6 h-6 text-orange-500 mb-3" />
            <h3 className="text-base font-bold mb-2">Resilient Telemetry Adapters</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Modular integration services query public GraphQL endpoints and fallback data mirrors. If third-party
              platforms enforce rate limits or profile privacy, data degrades gracefully with clear status flags.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-orange-100 shadow-sm">
            <Flame className="w-6 h-6 text-orange-500 mb-3" />
            <h3 className="text-base font-bold mb-2">Automated Streak Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tracks consecutive active days, prevents double-counting problems across platforms, and generates a
              GitHub/LeetCode style contribution calendar for each student.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-orange-100 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-orange-500 mb-3" />
            <h3 className="text-base font-bold mb-2">Multi-Tier Admin Oversight</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Equipped with Super Admin, Admin, and Moderator role hierarchies. Includes weekly student-by-day matrices,
              inactivity alert flags (Green, Yellow, Red), and batch broadcast announcements.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-slate-700">
          <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-orange-600" />
            <span>Privacy & Security Notice</span>
          </h4>
          <p className="leading-relaxed">
            DsArena only accesses publicly available profile metrics on LeetCode and GeeksforGeeks. At no point
            are students asked for platform passwords or confidential authentication tokens. Passwords within DsArena
            are hashed using bcrypt and stored in separate student and administrator collections.
          </p>
        </div>
      </main>
    </div>
  );
};
