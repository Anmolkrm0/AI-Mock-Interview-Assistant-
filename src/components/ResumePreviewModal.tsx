import React from 'react';

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName?: string;
  summary?: string;
}

export const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  isOpen,
  onClose,
  fileName = 'Alex_Chen_Staff_SWE_Resume.pdf',
  summary = '8 YOE, Distributed Systems, Python/Go, Cloud Architecture',
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-surface-container-high flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-surface-container-low border-b border-surface-container-high/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">description</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="resume-modal-title" className="font-title-md font-bold text-on-surface">
                  Candidate Resume Profile
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-semibold">
                  Parsed & Verified
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Print / Save PDF"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Modal Content - Resume Document Sheet */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-on-surface bg-white dark:bg-surface-container-lowest">
          {/* Document Header */}
          <div className="border-b border-surface-container-high pb-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Alex Chen</h1>
                <p className="text-primary font-medium text-sm">Staff Distributed Systems Engineer</p>
              </div>
              <div className="text-xs text-on-surface-variant space-y-0.5 md:text-right">
                <p>San Francisco, CA • alex.chen@example.io</p>
                <p className="font-mono">github.com/alexchen-dist • linkedin.com/in/alexchen-tech</p>
              </div>
            </div>

            {/* AI Extracted Highlights */}
            <div className="mt-4 p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
              <div className="text-xs">
                <span className="font-semibold text-on-surface">Extracted Profile Calibration: </span>
                <span className="text-on-surface-variant">{summary}</span>
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">person</span>
              Executive Summary
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Staff Software Engineer with 8+ years architecting globally distributed, low-latency financial state
              machines and transaction pipelines. Deep expertise in distributed consensus (Raft/Paxos), multi-datacenter
              consistency models, streaming architectures (Apache Kafka), and zero-loss payment idempotency. Experienced
              leading cross-functional initiatives and mentoring engineering organizations.
            </p>
          </div>

          {/* Technical Skills */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">code</span>
              Core Technical Competencies
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high/40">
                <span className="font-semibold text-on-surface">Languages & Frameworks: </span>
                <span className="text-on-surface-variant">Go (Golang), Python, Rust, Java, TypeScript, gRPC, Protobuf</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high/40">
                <span className="font-semibold text-on-surface">Distributed Systems: </span>
                <span className="text-on-surface-variant">Raft, Event Sourcing, CQRS, Apache Kafka, Redis Bloom Filters</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high/40">
                <span className="font-semibold text-on-surface">Databases & Storage: </span>
                <span className="text-on-surface-variant">PostgreSQL, ScyllaDB, CockroachDB, DynamoDB, AWS S3</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high/40">
                <span className="font-semibold text-on-surface">DevOps & Observability: </span>
                <span className="text-on-surface-variant">Kubernetes, Terraform, Envoy, OpenTelemetry, Prometheus</span>
              </div>
            </div>
          </div>

          {/* Work Experience */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">work</span>
              Professional Experience
            </h4>
            <div className="space-y-4">
              {/* Job 1 */}
              <div className="border-l-2 border-primary pl-4 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <h5 className="font-bold text-xs text-on-surface">
                    Staff Software Engineer • Stripe Platform Infrastructure
                  </h5>
                  <span className="text-[11px] text-on-surface-variant font-mono">2021 – Present</span>
                </div>
                <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1 mt-1 leading-relaxed">
                  <li>
                    Architected multi-datacenter idempotency and deduplication engine serving 45,000 requests/sec with
                    sub-20ms p99 latency and 99.999% SLA.
                  </li>
                  <li>
                    Eliminated race conditions during network partition events by engineering lease-based locks over
                    distributed consensus groups.
                  </li>
                  <li>
                    Spearheaded migration of legacy billing transaction pipeline to event-driven Kafka architecture with
                    guaranteed zero message loss.
                  </li>
                  <li>Mentored 12+ mid-level and senior engineers; led quarterly technical design reviews.</li>
                </ul>
              </div>

              {/* Job 2 */}
              <div className="border-l-2 border-surface-container-highest pl-4 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <h5 className="font-bold text-xs text-on-surface">
                    Senior Software Engineer • CloudScale Data Systems
                  </h5>
                  <span className="text-[11px] text-on-surface-variant font-mono">2018 – 2021</span>
                </div>
                <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1 mt-1 leading-relaxed">
                  <li>
                    Designed and scaled high-throughput CDC (Change Data Capture) ingestion engine handling 2.4B events
                    daily.
                  </li>
                  <li>
                    Optimized database connection pooling and sharding schemas, cutting p95 query latency by 42%.
                  </li>
                  <li>Authored disaster recovery protocols and executed cross-region warm-failover drills.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Education & Credentials */}
          <div className="border-t border-surface-container-high pt-4 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Education</h4>
              <p className="text-xs font-semibold text-on-surface">B.S. in Computer Science & Engineering</p>
              <p className="text-[11px] text-on-surface-variant">University of California, Berkeley • Magna Cum Laude</p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Certifications</h4>
              <p className="text-xs font-semibold text-on-surface">AWS Certified Solutions Architect – Professional</p>
              <p className="text-[11px] text-on-surface-variant">Certified Kubernetes Administrator (CKA)</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-surface-container-low border-t border-surface-container-high/60 flex items-center justify-between">
          <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
            Calibrated for AI Mock Interview Pipeline
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
