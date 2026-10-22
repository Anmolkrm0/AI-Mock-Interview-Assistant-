import React, { useState } from 'react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  aiEngineStatus?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  aiEngineStatus = 'AI Engine Ready',
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'new-interview', label: 'New Interview' },
    { id: 'interview-session', label: 'Interview Session' },
    { id: 'evaluation-report', label: 'Evaluation Report' },
    { id: 'history-and-analytics', label: 'History & Analytics' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container-high/60">
      <div className="h-16 max-w-7xl mx-auto px-gutter flex items-center justify-between gap-space-md">
        {/* Brand and Logo */}
        <div className="flex items-center gap-space-lg">
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-space-sm group text-left cursor-pointer focus:outline-none"
          >
            <img
              alt="InterviewMind Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1X8_6QfZQBlt2KdV5_FDIiVOCMR5t6qi2YfpclxT1NJghkKoAdPCVnCwkqEcB0mL5wagUTO_v5DbJugPO6hhTe3YH49cNES4JVS-dI_VX7Z3PUnXAijHSa0EJADaB2kEscsvse5xE_-MDjBIaT2S2YNs6NHs588JF9wJbqNgMslvEU8et7arIyc427ZNYZ-bAi2ob0N-ROcBA7zkEB0ypjdhf8FlE5KIzK6YiL29mJ350ot5Q9OZkCsG7k"
            />
            <span className="font-title-lg text-title-lg text-on-surface tracking-tight group-hover:text-primary transition-colors">
              InterviewMind
            </span>
            <span className="inline-flex items-center px-space-sm py-space-xs rounded-full font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed-variant font-medium">
              AI Mock Prep
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-space-xs p-1 rounded-full bg-surface-container-low">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                    isActive
                      ? 'bg-surface-container-high text-on-surface font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-space-md">
          {/* AI Engine Status Ping */}
          <div className="hidden sm:inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            {aiEngineStatus}
          </div>

          {/* Start Mock Quick Button */}
          <button
            onClick={() => onNavigate('new-interview')}
            className="inline-flex items-center justify-center px-space-md py-2 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-md text-label-md hover:bg-primary hover:text-on-primary transition-all shadow-[0_1px_4px_rgba(0,0,0,0.06)] cursor-pointer font-semibold"
          >
            Start Mock
          </button>

          {/* User Profile Avatar with dropdown */}
          <div className="relative flex items-center pl-space-xs">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-surface-container-high transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              type="button"
              aria-label="User menu"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-primary-fixed"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARgJudZKbIZ_RranUE2Fdo0airfrwNTmZCJvVFOUJn7_X2RHQiOkKKFT70xnXHwYlDvteAfNm0Q_r_GzUnOpcdN3xjIGcCVg7FYBb3M6PfeT9EBtLyalZ1rDdRrOi7_jCmnjg9exci8v8FMNJMncoNFP0CyVMojIBzUBESCge0C3W6L55q0wfBAbWBWfJLDRqbMeDQt7F6CGG7cRq_FoWDXdOvGv1-NeuU8rY_3gBRHq7MJLnM7Vzn"
              />
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                expand_more
              </span>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-high p-3 z-50">
                <div className="flex items-center gap-3 p-2 border-b border-surface-container mb-2">
                  <img
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuARgJudZKbIZ_RranUE2Fdo0airfrwNTmZCJvVFOUJn7_X2RHQiOkKKFT70xnXHwYlDvteAfNm0Q_r_GzUnOpcdN3xjIGcCVg7FYBb3M6PfeT9EBtLyalZ1rDdRrOi7_jCmnjg9exci8v8FMNJMncoNFP0CyVMojIBzUBESCge0C3W6L55q0wfBAbWBWfJLDRqbMeDQt7F6CGG7cRq_FoWDXdOvGv1-NeuU8rY_3gBRHq7MJLnM7Vzn"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-title-md text-sm text-on-surface font-semibold truncate">Alex Chen</span>
                    <span className="text-xs text-on-surface-variant truncate">alex.chen@staff.io</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      onNavigate('history-and-analytics');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">analytics</span>
                    Interview History & Progress
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('new-interview');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
                    Calibration Settings
                  </button>
                  <div className="border-t border-surface-container my-1"></div>
                  <div className="px-3 py-1.5 text-xs text-on-surface-variant flex items-center justify-between">
                    <span>Tier-1 Tech Mode</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold text-[10px]">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 bg-surface-container-low gap-2 border-t border-surface-container">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'text-on-surface-variant bg-surface-container'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
