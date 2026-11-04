import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { navigate } from '../services/router';

/** In-app link: real `href` (copy / middle-click works) but navigates without a reload. */
export const Link: React.FC<{
  to: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}> = ({ to, className, title, children }) => (
  <a
    href={`#${to}`}
    title={title}
    className={className}
    onClick={e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      navigate(to);
    }}
  >
    {children}
  </a>
);

export const BackButton: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = 'Back' }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center space-x-2 px-4 py-2 bg-[#14161f] hover:bg-[#1e2230] border border-[#2a2f42] hover:border-[#6f7bdc] text-slate-200 hover:text-white rounded-xl text-sm font-bold transition-all shadow-md"
  >
    <ArrowLeft className="w-4 h-4 text-[#6f7bdc]" />
    <span>{label}</span>
  </button>
);

export const StatCard: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode }> = ({ label, value, sub }) => (
  <div className="bg-[#14161f] border border-[#2a2f42] rounded-2xl p-4 shadow-lg shadow-[#0b0c12]/40">
    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6f7bdc]">{label}</div>
    <div className="text-2xl font-black text-white tracking-tight mt-1 tabular-nums">{value}</div>
    {sub && <div className="text-xs text-slate-400 mt-0.5 truncate">{sub}</div>}
  </div>
);

export const Section: React.FC<{
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
}> = ({ title, right, children, flush }) => (
  <section className="bg-[#14161f]/90 border border-[#2a2f42] rounded-3xl overflow-hidden shadow-xl shadow-[#0b0c12]/40">
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#2a2f42] bg-[#0b0c12]/70">
      <h3 className="text-sm font-black uppercase tracking-wider text-white">{title}</h3>
      {right}
    </div>
    <div className={flush ? '' : 'p-5'}>{children}</div>
  </section>
);

export const th = 'py-3 px-3 text-[11px] uppercase tracking-wider text-[#6f7bdc] font-bold whitespace-nowrap';
export const pctText = (v: number | null) => (v === null ? '–' : `${(v * 100).toFixed(1)}%`);
