import { useEffect, useState } from 'react';
import type { ToastType, UserRole } from '../types';

interface DemandDetailModalProps {
  visible: boolean;
  onClose: () => void;
  userRole: UserRole;
  data: {
    no: string;
    title: string;
    lead: string;
    sub: string;
    live: string;
    status: string;
    statusLabel: string;
    stage: string;
  } | null;
  showToast: (message: string, type?: ToastType) => void;
}

const TIMELINE_STEPS = [
  {
    title: 'Demand Submitted',
    sub: 'Initiator raised the demand request',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    title: 'Shaping & Review',
    sub: 'IT team reviewing scope and architecture',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M21 12h-2M5 12H3M12 21v-2M12 5V3" />
      </svg>
    ),
  },
  {
    title: 'Planning & Sourcing',
    sub: 'Resources, budget, vendor selection',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: 'Execution',
    sub: 'Active project delivery in progress',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: 'Completed',
    sub: 'Delivered and officially closed',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

// Stage → active step index
const STAGE_STEP: Record<string, number> = {
  Review: 2,
  Approval: 1,
  Returned: 1,
  Progress: 3,
  Draft: 0,
};

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Needs Improvement',
  3: 'Satisfactory',
  4: 'Good',
  5: 'Excellent',
};

export default function DemandDetailModal({ visible, onClose, userRole, data, showToast }: DemandDetailModalProps) {
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [hoverStar, setHoverStar] = useState<number>(0);

  useEffect(() => {
    if (!visible) return;
    setComment('');
    setRating(0);
    setHoverStar(0);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, onClose]);

  if (!visible || !data) return null;

  const isReviewer = userRole === 'reviewer';
  const isApprover = userRole === 'approver';
  const canComment = isReviewer || isApprover;
  const activeStep = STAGE_STEP[data.stage] ?? 0;

  const getStepClass = (idx: number) => {
    if (idx < activeStep) return 'tl-done';
    if (idx === activeStep) return 'tl-active';
    return 'tl-pending';
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Head */}
        <div className="modal-head">
          <div className="modal-head-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <div className="modal-no">{data.no}</div>
            <div className="modal-title">{data.title}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="modal-section">
            <div className="ms-title">Demand Information</div>
            <div className="ms-grid">
              <div className="ms-field">
                <div className="ms-field-lbl">Demand No.</div>
                <div className="ms-field-val">{data.no}</div>
              </div>
              <div className="ms-field">
                <div className="ms-field-lbl">Current Status</div>
                <div className="ms-field-val">
                  <span className={`badge ${data.status}`}>
                    <span className={`bdot d-${data.status.replace('b-', '')}`} />
                    {data.statusLabel}
                  </span>
                </div>
              </div>
              <div className="ms-field">
                <div className="ms-field-lbl">IT Lead</div>
                <div className={`ms-field-val${data.lead === 'Unassigned' ? ' unassigned' : ''}`}>{data.lead}</div>
              </div>
              <div className="ms-field">
                <div className="ms-field-lbl">Submission Date</div>
                <div className="ms-field-val">{data.sub}</div>
              </div>
              <div className="ms-field">
                <div className="ms-field-lbl">Planned Go Live</div>
                <div className="ms-field-val">{data.live}</div>
              </div>
              <div className="ms-field">
                <div className="ms-field-lbl">Demand Type</div>
                <div className="ms-field-val">New System</div>
              </div>
            </div>
          </div>

          <div className="modal-section">
            <div className="ms-title">Pipeline Progress</div>
            <div className="timeline-steps">
              {TIMELINE_STEPS.map((step, idx) => (
                <div key={idx} className="tl-step">
                  <div className={`tl-dot ${getStepClass(idx)}`}>
                    {step.icon}
                  </div>
                  <div className="tl-info">
                    <div className="tl-step-title">{step.title}</div>
                    <div className="tl-step-sub">{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments — visible to Reviewer & Approver */}
          {canComment && (
            <div className="modal-section">
              <div className="ms-title">
                {isApprover ? 'Approver Comments' : 'Reviewer Comments'}
              </div>
              <textarea
                className="ddm-textarea"
                placeholder={`Add your ${isApprover ? 'approval' : 'review'} comments here…`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Demand Rating — Reviewer & Approver */}
          {canComment && (
            <div className="modal-section">
              <div className="ms-title">Demand Rating</div>
              <div className="ddm-stars-wrap">
                <div
                  className="ddm-stars"
                  onMouseLeave={() => setHoverStar(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = star <= (hoverStar || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`ddm-star${filled ? ' filled' : ''}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverStar(star)}
                        aria-label={`${star} star`}
                      >
                        <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
                <span className="ddm-stars-label">
                  {rating > 0
                    ? `${rating}/5 — ${RATING_LABELS[rating]}`
                    : 'Click a star to rate'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-foot">
          <button className="mf-btn-s" onClick={onClose}>Close</button>
          {canComment ? (
            <>
              <button
                className="mf-btn-return"
                onClick={() => {
                  if (!comment.trim()) {
                    showToast('Please add comments before returning', 'warn');
                    return;
                  }
                  showToast('Demand returned with comments', 'warn');
                  onClose();
                }}
              >
                Return for Revision
              </button>
              <button
                className="mf-btn-p"
                onClick={() => {
                  if (rating === 0) {
                    showToast('Please provide a demand rating', 'warn');
                    return;
                  }
                  const action = isApprover ? 'approved' : 'forwarded to next stage';
                  showToast(`Demand ${action}`, 'success');
                  onClose();
                }}
              >
                {isApprover ? 'Approve Demand' : 'Forward to Next Stage'} →
              </button>
            </>
          ) : (
            <button
              className="mf-btn-p"
              onClick={() => {
                showToast('Demand forwarded to next stage', 'success');
                onClose();
              }}
            >
              Forward to Next Stage →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
