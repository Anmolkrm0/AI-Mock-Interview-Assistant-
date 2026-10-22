import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-low py-space-lg shadow-[0_-1px_8px_rgba(0,0,0,0.02)] border-t border-surface-container-high/60 mt-auto">
      <div className="max-w-7xl mx-auto px-gutter flex flex-col sm:flex-row items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm">
          <span className="font-title-md text-title-md text-on-surface font-bold">InterviewMind</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            © 2025 AI Career Intelligence. All rights reserved.
          </span>
        </div>
        <div className="flex items-center gap-space-md">
          <a
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
            href="#privacy"
            onClick={(e) => e.preventDefault()}
          >
            Privacy Framework
          </a>
          <a
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
            href="#rubrics"
            onClick={(e) => e.preventDefault()}
          >
            Interview Rubrics
          </a>
          <a
            className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5"
            href="#status"
            onClick={(e) => e.preventDefault()}
          >
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            System Status
          </a>
        </div>
      </div>
    </footer>
  );
};
