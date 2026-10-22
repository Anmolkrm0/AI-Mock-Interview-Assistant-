import React, { useState } from 'react';
import { SessionReport, InterviewRigor } from '../types';

interface HistoryAnalyticsProps {
  sessions: SessionReport[];
  onSelectSession: (session: SessionReport) => void;
  onStartNewMock: () => void;
}

export const HistoryAnalytics: React.FC<HistoryAnalyticsProps> = ({
  sessions,
  onSelectSession,
  onStartNewMock,
}) => {
  const [viewMode, setViewMode] = useState<'populated' | 'empty'>('populated');
  const [searchQuery, setSearchQuery] = useState('');
  const [rigorFilter, setRigorFilter] = useState<'All Modes' | InterviewRigor>('All Modes');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'longest' | 'shortest'>('newest');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Filter and sort sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.companyRef && s.companyRef.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRigor = rigorFilter === 'All Modes' || s.rigor === rigorFilter;
    return matchesSearch && matchesRigor;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (sortBy === 'highest') return b.overallScore - a.overallScore;
    if (sortBy === 'longest') return b.durationMinutes - a.durationMinutes;
    if (sortBy === 'shortest') return a.durationMinutes - b.durationMinutes;
    return 0; // default newest
  });

  const toggleCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else {
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  const clearComparison = () => {
    setSelectedForCompare([]);
  };

  const comparedSessions = sessions.filter((s) => selectedForCompare.includes(s.id));

  return (
    <div className="w-full bg-surface min-h-[calc(100vh-140px)] flex flex-col pb-space-xl">
      <div className="max-w-7xl mx-auto w-full px-gutter py-space-xl flex flex-col gap-space-xl">
        {/* Top Level Dashboard Header & Analytics Hero */}
        <div className="flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs max-w-2xl">
              <div className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm w-fit mb-1 font-semibold">
                <span className="material-symbols-outlined text-[14px]">insights</span>
                Continuous Calibration
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                Interview History &amp; Progress Analytics
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Track your growth, compare performance across interview difficulties, and review comprehensive
                reports.
              </p>
            </div>

            {/* Mode Toggle: Populated Records vs Clean Empty State Preview */}
            <div className="flex items-center self-start md:self-auto bg-surface-container-low p-1 rounded-full shadow-xs border border-surface-container">
              <button
                onClick={() => setViewMode('populated')}
                className={`px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'populated'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                <span>Session Records ({sessions.length})</span>
              </button>
              <button
                onClick={() => setViewMode('empty')}
                className={`px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'empty'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">folder_off</span>
                <span>Empty State Preview</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip + Performance Progression Chart */}
          <div
            className={`grid grid-cols-1 lg:grid-cols-12 gap-space-md transition-opacity duration-300 ${
              viewMode === 'empty' ? 'opacity-40 pointer-events-none' : 'opacity-100'
            }`}
          >
            {/* 4 Metric Cards Matrix (7 Cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              {/* Metric 1: Total Sessions */}
              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                    Total Interviews Completed
                  </span>
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                  </div>
                </div>
                <div className="mt-space-md flex items-baseline gap-space-xs">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    {sessions.length}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant">Sessions</span>
                </div>
                <div className="mt-space-sm flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>100% evaluated by AI</span>
                </div>
              </div>

              {/* Metric 2: Average Score */}
              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                    Average Score
                  </span>
                  <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined text-[20px]">speed</span>
                  </div>
                </div>
                <div className="mt-space-md flex items-baseline gap-space-xs">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    {(
                      sessions.reduce((acc, s) => acc + s.overallScore, 0) / (sessions.length || 1)
                    ).toFixed(1)}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant">/ 100</span>
                </div>
                <div className="mt-space-sm flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span>+12% over last 30 days</span>
                </div>
              </div>

              {/* Metric 3: Highest Performance */}
              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                    Highest Performance
                  </span>
                  <div className="w-9 h-9 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant">
                    <span className="material-symbols-outlined text-[20px]">military_tech</span>
                  </div>
                </div>
                <div className="mt-space-md flex items-baseline gap-space-xs">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    {Math.max(...sessions.map((s) => s.overallScore), 92)}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant">/ 100</span>
                </div>
                <p className="mt-space-sm font-label-sm text-label-sm text-on-surface-variant truncate">
                  Staff Backend Engineer (Meta Track)
                </p>
              </div>

              {/* Metric 4: Practice Hours */}
              <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant font-medium">
                    Practice Hours
                  </span>
                  <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                  </div>
                </div>
                <div className="mt-space-md flex items-baseline gap-space-xs">
                  <span className="font-headline-lg text-headline-lg text-on-surface font-bold">3.4</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">Hours Logged</span>
                </div>
                <div className="mt-space-sm flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[14px]">timer</span>
                  <span>Average session: 34m</span>
                </div>
              </div>
            </div>

            {/* Trend Progression Inline Chart Card (5 Cols) */}
            <div className="lg:col-span-5 bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-bold">Score Trajectory</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Progression across 6 simulation runs
                  </span>
                </div>
                <div className="inline-flex items-center gap-1 font-label-sm text-label-sm px-space-sm py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                  <span className="material-symbols-outlined text-[14px]">show_chart</span>
                  <span>+16 pts Delta</span>
                </div>
              </div>

              {/* Vector Area/Line Chart */}
              <div className="relative w-full h-36 my-2 flex items-end">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 120">
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#005bbf" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#005bbf" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Horizontal Guideline grids */}
                  <line stroke="#dee3e9" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="320" y1="15" y2="15" />
                  <line stroke="#dee3e9" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="320" y1="55" y2="55" />
                  <line stroke="#dee3e9" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="320" y1="95" y2="95" />
                  {/* Area Fill */}
                  <path
                    d="M 0,105 L 0,84 L 64,74 L 128,52 L 192,62 L 256,36 L 320,44 L 320,115 L 0,115 Z"
                    fill="url(#scoreGradient)"
                  />
                  {/* Main Stroke Line */}
                  <path
                    d="M 0,84 L 64,74 L 128,52 L 192,62 L 256,36 L 320,44"
                    fill="none"
                    stroke="#005bbf"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                  {/* Data Node Circles */}
                  <circle cx="0" cy="84" fill="#ffffff" r="3.5" stroke="#005bbf" strokeWidth="2" />
                  <circle cx="64" cy="74" fill="#ffffff" r="3.5" stroke="#005bbf" strokeWidth="2" />
                  <circle cx="128" cy="52" fill="#ffffff" r="3.5" stroke="#005bbf" strokeWidth="2" />
                  <circle cx="192" cy="62" fill="#ffffff" r="3.5" stroke="#005bbf" strokeWidth="2" />
                  <circle cx="256" cy="36" fill="#ffffff" r="3.5" stroke="#005bbf" strokeWidth="2" />
                  <circle cx="320" cy="44" fill="#005bbf" r="4.5" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>

              {/* X-Axis Labels */}
              <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm pt-space-xs">
                <span>S1 (72)</span>
                <span>S2 (76)</span>
                <span>S3 (84)</span>
                <span>S4 (79)</span>
                <span>S5 (91)</span>
                <span className="font-semibold text-primary">S6 (88)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE STATE: Session cards and filter controls */}
        {viewMode === 'populated' && sessions.length > 0 && (
          <div className="flex flex-col gap-space-lg">
            {/* Filter Bar, Rigor Chips & Sorting Controls */}
            <div className="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm border border-surface-container flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[260px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  search
                </span>
                <input
                  className="w-full bg-surface-container-low pl-10 pr-4 py-2.5 rounded-full font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all border border-surface-container"
                  placeholder="Search by role, company, or skill..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter Rigor Segment Chips */}
              <div className="flex items-center gap-space-xs overflow-x-auto pb-1 md:pb-0">
                {(['All Modes', 'Standard', 'Target Bar', 'Stress Test'] as const).map((mode) => {
                  const isSelected = rigorFilter === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setRigorFilter(mode)}
                      className={`px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-primary-fixed text-on-primary-fixed-variant font-semibold shadow-xs'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                      type="button"
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>

              {/* Sort Select */}
              <div className="flex items-center gap-space-xs self-end md:self-auto">
                <span className="material-symbols-outlined text-[18px] text-outline">sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-surface-container-low text-on-surface font-label-md text-label-md px-space-md py-2 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-all border border-surface-container"
                >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Score</option>
                  <option value="longest">Duration: Longest</option>
                  <option value="shortest">Duration: Shortest</option>
                </select>
              </div>
            </div>

            {/* Past Sessions Stream */}
            <div className="flex flex-col gap-space-md">
              {sortedSessions.map((s) => {
                const isChecked = selectedForCompare.includes(s.id);
                return (
                  <div
                    key={s.id}
                    className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg border border-surface-container"
                  >
                    <div className="flex items-start gap-space-md min-w-0">
                      {/* Checkbox for compare */}
                      <label className="relative flex items-center pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCompare(s.id)}
                          className="w-5 h-5 rounded-md accent-primary text-on-primary cursor-pointer"
                        />
                      </label>

                      <div className="w-12 h-12 rounded-xl bg-primary-fixed/60 flex items-center justify-center shrink-0 text-primary">
                        <span className="material-symbols-outlined text-[26px]">
                          {s.rigor === 'Stress Test'
                            ? 'cloud'
                            : s.rigor === 'Standard'
                            ? 'dataset'
                            : 'terminal'}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-space-xs mb-1">
                          <h3 className="font-title-lg text-title-lg text-on-surface font-bold truncate">
                            {s.role}
                          </h3>
                          <span
                            className={`px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-medium ${
                              s.rigor === 'Target Bar'
                                ? 'bg-primary-fixed text-on-primary-fixed-variant'
                                : s.rigor === 'Stress Test'
                                ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                                : 'bg-secondary-container text-on-secondary-container'
                            }`}
                          >
                            {s.rigor}
                          </span>
                          <span className="px-space-sm py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant font-medium">
                            {s.companyRef || 'Stripe JD Ref'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-space-md font-body-sm text-body-sm text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            {s.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            {s.actualDuration || `${s.durationMinutes} mins`}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                            Voice + Code Sandbox
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-space-lg w-full lg:w-auto justify-between lg:justify-end">
                      {/* Score & Verdict */}
                      <div className="flex items-center gap-space-md">
                        <div className="flex flex-col text-right">
                          <span className="font-headline-md text-headline-md font-bold text-primary">
                            {s.overallScore}
                            <span className="text-on-surface-variant font-normal text-body-md">/100</span>
                          </span>
                          <span className="font-label-sm text-label-sm text-secondary font-semibold">
                            {s.verdict || 'Strong Hire Verdict'}
                          </span>
                        </div>

                        {/* Mini Radial Visualizer */}
                        <div className="relative w-11 h-11 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-surface-container"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                            />
                            <path
                              className="text-primary"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeDasharray={`${s.overallScore}, 100`}
                              strokeLinecap="round"
                              strokeWidth="3.5"
                            />
                          </svg>
                          <span className="material-symbols-outlined text-[18px] text-primary absolute">
                            verified
                          </span>
                        </div>
                      </div>

                      {/* Action Cluster */}
                      <div className="flex items-center gap-space-xs">
                        <button
                          onClick={() => onSelectSession(s)}
                          className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
                          title="Read Full Transcript"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[20px]">description</span>
                        </button>
                        <button
                          onClick={() => onSelectSession(s)}
                          className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors cursor-pointer"
                          title="Play Recording Playback"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[20px]">play_circle</span>
                        </button>
                        <button
                          onClick={() => onSelectSession(s)}
                          className="inline-flex items-center gap-1.5 px-space-md py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all shadow-sm cursor-pointer font-semibold"
                          type="button"
                        >
                          <span>View Full Report</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Metadata */}
            <div className="flex items-center justify-between text-on-surface-variant font-label-md text-label-md pt-space-sm border-t border-surface-container">
              <span>Showing {sortedSessions.length} archived sessions</span>
              <div className="flex items-center gap-space-xs">
                <button
                  className="p-1.5 rounded-full text-outline opacity-40 cursor-not-allowed"
                  disabled
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-semibold">
                  1
                </span>
                <button className="p-1.5 rounded-full hover:bg-surface-container transition-colors cursor-pointer" type="button">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE VIEW */}
        {(viewMode === 'empty' || sessions.length === 0) && (
          <div className="flex flex-col items-center justify-center p-space-xl bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container text-center py-20">
            <div className="relative w-24 h-24 mb-space-md flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary-fixed/40 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary relative z-10 shadow-sm">
                <span className="material-symbols-outlined text-[36px]">event_note</span>
              </div>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight mb-space-xs">
              No interviews yet
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto mb-space-lg leading-relaxed">
              Start your first mock interview to track your progress, calibrate your skills, and generate
              actionable scorecards.
            </p>
            <div className="flex items-center gap-space-md">
              <button
                onClick={onStartNewMock}
                className="inline-flex items-center gap-space-xs px-space-xl py-3 rounded-full bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-all shadow-md cursor-pointer font-bold"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>Start First Mock Interview</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Comparison Floating Drawer */}
      {selectedForCompare.length > 0 && viewMode === 'populated' && (
        <aside className="sticky bottom-4 z-40 max-w-4xl mx-auto w-[calc(100%-2rem)] bg-inverse-surface text-inverse-on-surface p-space-md rounded-2xl shadow-2xl transition-all duration-300 border border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">compare_arrows</span>
              </div>
              <div>
                <h4 className="font-title-md text-title-md font-semibold text-inverse-on-surface">
                  Compare Sessions
                </h4>
                <p className="font-body-sm text-body-sm text-surface-variant">
                  {selectedForCompare.length} session{selectedForCompare.length > 1 ? 's' : ''} selected. Ready
                  to contrast rubric parameters side-by-side.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-space-sm w-full sm:w-auto justify-end">
              <button
                onClick={clearComparison}
                className="px-space-md py-2 rounded-full font-label-md text-label-md text-inverse-on-surface/80 hover:bg-white/10 transition-colors cursor-pointer"
                type="button"
              >
                Clear
              </button>
              <button
                onClick={() => setCompareModalOpen(true)}
                className="px-space-lg py-2 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-md text-label-md font-bold hover:bg-white transition-all shadow-sm cursor-pointer"
                type="button"
              >
                Run Comparison
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Side-by-Side Comparison Modal */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-gutter bg-inverse-surface/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl max-w-3xl w-full p-space-lg shadow-2xl border border-surface-container flex flex-col gap-space-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">compare_arrows</span>
                <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                  Side-by-Side Session Analysis
                </h3>
              </div>
              <button
                onClick={() => setCompareModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {comparedSessions.map((cs) => (
                <div
                  key={cs.id}
                  className="bg-surface-container-low rounded-xl p-space-md border border-surface-container space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-primary font-semibold block">{cs.date}</span>
                      <h4 className="font-title-md text-sm font-bold text-on-surface">{cs.role}</h4>
                      <span className="text-xs text-on-surface-variant">{cs.rigor} Mode</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-primary">{cs.overallScore}</span>
                      <span className="text-xs text-on-surface-variant block">/ 100</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-surface-container-lowest text-xs font-semibold text-secondary">
                    {cs.verdict}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-on-surface block">Dimensions:</span>
                    {cs.dimensions?.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-on-surface-variant">
                        <span>{d.name}</span>
                        <span className="font-bold text-on-surface">{d.score}%</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setCompareModalOpen(false);
                      onSelectSession(cs);
                    }}
                    className="w-full mt-2 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer"
                  >
                    View Report
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-surface-container">
              <button
                onClick={() => setCompareModalOpen(false)}
                className="px-5 py-2 rounded-full bg-surface-container text-on-surface font-semibold text-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
