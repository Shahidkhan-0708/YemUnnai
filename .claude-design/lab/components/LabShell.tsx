// LabShell.tsx - Main lab layout wrapper
// Provides a consistent lab environment with header, instructions, and responsive grid

import React from 'react';

interface LabShellProps {
  title: string;
  subtitle: string;
  instructions: string;
  children: React.ReactNode;
  briefSummary?: { label: string; value: string }[];
}

export function LabShell({ title, subtitle, instructions, children, briefSummary }: LabShellProps) {
  return (
    <div className="min-h-screen bg-[#E8ECEF] text-[#1F140A]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-[#D6DCE2] sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1F140A]">{title}</h1>
              <p className="text-sm text-[#7A6658] mt-0.5">{subtitle}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FFF0E3] text-[#A23D00] uppercase tracking-wide">
                Design Lab
              </span>
            </div>
          </div>

          {/* Brief summary chips */}
          {briefSummary && briefSummary.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {briefSummary.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                  <span className="font-bold text-[#7A6658]">{item.label}:</span>
                  <span className="text-[#1F140A] font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Instructions */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="bg-[#FFF8F2] border border-[#F0E8E0] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F06A05" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <p className="text-sm font-semibold text-[#1F140A] mb-1">How to review</p>
              <p className="text-xs text-[#7A6658] leading-relaxed">{instructions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Variant grid */}
      <main className="max-w-6xl mx-auto px-4 pb-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D6DCE2] bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 text-center">
          <p className="text-[10px] text-[#7A6658]">
            Yemunnai Design Lab · All variants use shared fixture data · Plus Jakarta Sans · #F06A05 orange theme
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LabShell;