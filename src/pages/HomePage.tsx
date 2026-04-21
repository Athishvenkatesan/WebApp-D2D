import { useEffect, useRef, useState } from 'react';
import type { TabId, ToastType } from '../types';

interface HomePageProps {
  onTabChange: (tab: TabId) => void;
  showToast: (message: string, type?: ToastType) => void;
  openStepIndex: number | null;
  setOpenStepIndex: (idx: number | null) => void;
  inboxCount: number;
}

const STEP_DATA = [
  {
    title: 'Submit Demand',
    desc: 'Select type and fill in all required details.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    detailText:
      'The initiator raises a new demand by selecting the appropriate demand type (New System, Enhancement, or POC) and filling in all required information including business justification, scope, and expected outcomes.',
    tags: ['Initiator Action', 'Form Submission', 'Auto-Notification'],
  },
  {
    title: 'Shaping & Review',
    desc: 'IT team defines scope and architecture.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M21 12h-2M5 12H3M12 21v-2M12 5V3" />
      </svg>
    ),
    detailText:
      'The assigned IT team reviews and shapes the demand in detail — defining technical scope, architecture approach, solution design, risk assessment, and resource implications before moving forward.',
    tags: ['IT Team Review', 'Solution Design', 'Architecture', 'Risk Assessment'],
  },
  {
    title: 'Planning & Sourcing',
    desc: 'Resources, budgets, vendor selection.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    detailText:
      'Resources, project timelines, and technology sourcing are planned and aligned. Budget approval is obtained and vendors are evaluated and selected through the procurement process.',
    tags: ['Resource Planning', 'Budget Approval', 'Vendor Selection', 'Timeline Setup'],
  },
  {
    title: 'Execution',
    desc: 'Deliver through governance framework.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    detailText:
      'The approved plan is executed by the project team. Regular progress updates are tracked through the governance framework. Milestones are monitored and reported to stakeholders throughout delivery.',
    tags: ['Project Delivery', 'Milestone Tracking', 'Governance', 'UAT Testing'],
  },
  {
    title: 'Completed',
    desc: 'Delivered, closed, outcomes measured.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    detailText:
      'The demand is fully delivered and officially closed. Outcomes are tracked against original objectives, stakeholder feedback is gathered, success metrics are measured, and lessons learned are documented.',
    tags: ['Delivery Closure', 'Outcome Tracking', 'Stakeholder Feedback', 'Lessons Learned'],
  },
];

export default function HomePage({ onTabChange, showToast, openStepIndex, setOpenStepIndex, inboxCount }: HomePageProps) {
  const fill1Ref = useRef<HTMLDivElement>(null);
  const fill2Ref = useRef<HTMLDivElement>(null);
  const lineFillRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fill1Ref.current) fill1Ref.current.style.width = '72%';
      if (fill2Ref.current) fill2Ref.current.style.width = '80%';
      if (lineFillRef.current) lineFillRef.current.style.width = '100%';
      setAnimated(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const currentStep = openStepIndex !== null ? STEP_DATA[openStepIndex] : null;

  return (
    <>
      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-circle2" />
        <div className="hero-l">
          <div className="hero-pill">
            <div className="hero-pill-dot" />
            <span className="hero-pill-txt">Live System · DEWA IT Governance Platform</span>
          </div>
          <div className="hero-h">
            Demand to<br />Delivery <em>(D2D)</em>
          </div>
          <p className="hero-p">
            Streamline your IT demand management with a structured, transparent, and efficient governance process — from submission to full execution.
          </p>
          <div className="hero-btns">
            <button className="btn-hp" onClick={() => onTabChange('workspace')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              Demand Workspace
            </button>
            <button className="btn-hs" onClick={() => onTabChange('inbox')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 9 12 15 21 9" />
                <path d="M21 9V19a2 2 0 01-2 2H5a2 2 0 01-2-2V9" />
              </svg>
              Inbox ({inboxCount} Pending)
            </button>
          </div>
        </div>

        {/* Stats panel */}
        <div className="hero-r">
          <div className="hr-lbl">Live Metrics</div>
          <div className="hr-grid">
            <div className="hr-box" onClick={() => { onTabChange('workspace'); showToast('Showing all 10 demands', 'success'); }}>
              <div className="hr-box-num">10</div>
              <div className="hr-box-lbl">Active Demands</div>
            </div>
            <div className="hr-box" onClick={() => onTabChange('inbox')}>
              <div className="hr-box-num">{inboxCount}</div>
              <div className="hr-box-lbl">Pending Approval</div>
            </div>
            <div className="hr-box" onClick={() => showToast('1 demand fully completed this period', 'success')}>
              <div className="hr-box-num">1</div>
              <div className="hr-box-lbl">Completed</div>
            </div>
            <div className="hr-box" onClick={() => showToast('5 IT leads currently assigned', 'success')}>
              <div className="hr-box-num">5</div>
              <div className="hr-box-lbl">IT Leads Active</div>
            </div>
          </div>
          <div className="hr-prog">
            <div className="hr-prog-row">
              <span className="hr-prog-lbl">Pipeline Health</span>
              <span className="hr-prog-pct">72%</span>
            </div>
            <div className="hr-track">
              <div
                ref={fill1Ref}
                className="hr-fill"
                style={{ width: animated ? '72%' : '0%' }}
              />
            </div>
          </div>
          <div className="hr-prog">
            <div className="hr-prog-row">
              <span className="hr-prog-lbl">On-Track Demands</span>
              <span className="hr-prog-pct">80%</span>
            </div>
            <div className="hr-track">
              <div
                ref={fill2Ref}
                className="hr-fill"
                style={{ width: animated ? '80%' : '0%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── DEMAND TYPES ── */}
      <div className="dt-section">
        <div className="sec-eyebrow">What We Support</div>
        <div className="sec-title">Demand Types</div>
        <div className="sec-desc">
          The D2D platform supports three types of demands across the full governance lifecycle — each designed for a specific initiative scope and scale.
        </div>
        <div className="dt-cards">
          {/* New System */}
          <div className="dt-card" onClick={() => showToast('New System — full lifecycle governance', 'success')}>
            <div className="dt-card-num">01</div>
            <div className="dt-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="dt-tag">Turnkey / New Initiative</div>
            <div className="dt-title">New System</div>
            <div className="dt-desc">For brand-new projects, platforms, or initiatives requiring full lifecycle governance from concept to completion.</div>
            <div className="dt-learn">
              Learn more
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Enhancement */}
          <div className="dt-card" onClick={() => showToast('Enhancement — extend existing systems', 'success')}>
            <div className="dt-card-num">02</div>
            <div className="dt-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div className="dt-tag">Enhancement Request</div>
            <div className="dt-title">Enhancement</div>
            <div className="dt-desc">For changes, enhancements, or extensions to an existing system — scoped and governed end-to-end.</div>
            <div className="dt-learn">
              Learn more
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* POC */}
          <div className="dt-card" onClick={() => showToast('POC — validate feasibility first', 'success')}>
            <div className="dt-card-num">03</div>
            <div className="dt-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18" />
              </svg>
            </div>
            <div className="dt-tag">POC / Feasibility</div>
            <div className="dt-title">Proof of Concept</div>
            <div className="dt-desc">Validate technical feasibility and viability before committing full resources to implementation.</div>
            <div className="dt-learn">
              Learn more
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="hiw-section">
        <div className="hiw-deco" />
        <div className="hiw-head">
          <div className="hiw-eyebrow">The Journey</div>
          <div className="hiw-title">How It Works</div>
          <div className="hiw-desc">
            Click any step to see detailed information. A simple, streamlined 5-stage process takes your demand from submission to delivered solution.
          </div>
        </div>

        <div className="hiw-steps-wrap">
          <div className="hiw-line">
            <div ref={lineFillRef} className="hiw-line-fill" style={{ width: '100%' }} />
          </div>
          <div className="hiw-steps">
            {STEP_DATA.map((step, idx) => (
              <div
                key={idx}
                className={`hiw-step${idx < 2 ? ' done' : ''}${openStepIndex === idx ? ' active-step' : ''}`}
                onClick={() => setOpenStepIndex(openStepIndex === idx ? null : idx)}
              >
                <div className="hiw-step-circle">
                  <div className="hiw-step-n">{idx + 1}</div>
                  {step.icon}
                </div>
                <div className="hiw-step-title">{step.title}</div>
                <div className="hiw-step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step detail panel */}
        {currentStep && (
          <div className="step-detail">
            <div className="step-detail-inner">
              <div className="sd-icon">{currentStep.icon}</div>
              <div className="sd-content">
                <div className="sd-title">{currentStep.title}</div>
                <div className="sd-text">{currentStep.detailText}</div>
                <div className="sd-tags">
                  {currentStep.tags.map((tag) => (
                    <span key={tag} className="sd-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <button className="sd-close" onClick={() => setOpenStepIndex(null)}>✕ Close</button>
          </div>
        )}
      </div>
    </>
  );
}
