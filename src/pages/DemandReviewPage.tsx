import { useState } from 'react';
import type { AuthUser, EnhancementDemand, ToastType } from '../types';
import { updateDemand, getStatusLabel, getStatusBadgeClass } from '../store';

interface DemandReviewPageProps {
  demand: EnhancementDemand;
  currentUser: AuthUser;
  onBack: () => void;
  backLabel?: string;
  showToast: (msg: string, type?: ToastType) => void;
  onActionDone: () => void;
  onEdit?: (demand: EnhancementDemand) => void;
}

function FieldRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="drp-field">
      <div className="drp-field-label">{label}</div>
      <div className="drp-field-value">{value}</div>
    </div>
  );
}

// Auto-generate a demand summary paragraph from the demand fields
function generateSummary(d: EnhancementDemand): string {
  const type = (() => {
    const t = d.demandTitle.toLowerCase();
    if (/poc|proof of concept|feasibility/.test(t)) return 'proof of concept';
    if (/new system|new platform/.test(t)) return 'new system initiative';
    return 'enhancement request';
  })();

  const parts: string[] = [];
  parts.push(`This demand is an ${type} — "${d.demandTitle}".`);

  if (d.currentState) {
    const s = d.currentState.trim();
    parts.push(`Currently, ${s.charAt(0).toLowerCase() + s.slice(1)}${s.endsWith('.') ? '' : '.'}`);
  }
  if (d.challengesGaps) {
    const c = d.challengesGaps.trim();
    parts.push(`Key challenges: ${c.charAt(0).toLowerCase() + c.slice(1)}${c.endsWith('.') ? '' : '.'}`);
  }
  if (d.detailedRequirement) {
    const r = d.detailedRequirement.trim().split('\n')[0];
    parts.push(`Proposed solution: ${r.charAt(0).toLowerCase() + r.slice(1)}${r.endsWith('.') ? '' : '.'}`);
  } else if (d.expectedDelivery) {
    const e = d.expectedDelivery.trim().split('\n')[0];
    parts.push(`Expected outcome: ${e}${e.endsWith('.') ? '' : '.'}`);
  }
  if (d.strategicObjectives) parts.push(`Aligns with: ${d.strategicObjectives}.`);
  if (d.benefitStatement) {
    const b = d.benefitStatement.trim().split('\n')[0];
    parts.push(`Expected benefits: ${b.charAt(0).toLowerCase() + b.slice(1)}${b.endsWith('.') ? '' : '.'}`);
  }
  return parts.join(' ');
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Needs Improvement',
  3: 'Satisfactory',
  4: 'Good',
  5: 'Excellent',
};

const WORKFLOW_STEPS = [
  { label: 'Initiator Submitted' },
  { label: 'Reviewer Review' },
  { label: 'Approver Approval' },
  { label: 'Demand Shaping' },
];

export default function DemandReviewPage({
  demand, currentUser, onBack, backLabel, showToast, onActionDone, onEdit,
}: DemandReviewPageProps) {
  const [reviewerComments,      setReviewerComments]      = useState('');
  const [approverComments,      setApproverComments]      = useState('');
  const [reviewerCommentError,  setReviewerCommentError]  = useState('');
  const [approverCommentError,  setApproverCommentError]  = useState('');
  const [acting,                setActing]                = useState(false);
  const [showFullDetails,       setShowFullDetails]       = useState(false);
  const [reviewerOpen,          setReviewerOpen]          = useState(currentUser.role === 'reviewer');
  const [approverOpen,          setApproverOpen]          = useState(currentUser.role === 'approver');
  const [reviewerRating,        setReviewerRating]        = useState(0);
  const [approverRating,        setApproverRating]        = useState(0);
  const [hoverStar,             setHoverStar]             = useState(0);
  const [ratingOpen,            setRatingOpen]            = useState(true);

  const isReviewer = currentUser.role === 'reviewer';
  const isApprover = currentUser.role === 'approver';
  const isInitiator = currentUser.role === 'initiator';
  const isNonSAP = demand.systemType === 'Non-SAP';
  const isEditable = isInitiator && (demand.status === 'draft' || demand.status === 'reviewer_returned' || demand.status === 'approver_returned');

  const reviewerCanAct = isReviewer && demand.status === 'submitted';
  const approverCanAct = isApprover && demand.status === 'reviewer_approved';

  const statusBadge  = getStatusBadgeClass(demand.status);
  const statusLabel  = getStatusLabel(demand.status);
  const demandSummary = generateSummary(demand);

  // ── Action handler ────────────────────────────────────────────
  const doAction = (
    type: 'return' | 'approve',
    role: 'reviewer' | 'approver',
    comments: string,
    setError: (e: string) => void,
  ) => {
    if (type === 'return' && !comments.trim()) {
      setError('Please add comments before returning the demand.');
      return;
    }
    setActing(true);
    const now = new Date().toISOString();
    let updates: Partial<EnhancementDemand>;

    if (role === 'reviewer') {
      updates = type === 'return'
        ? { status: 'reviewer_returned', reviewerComments: comments, reviewerActionDate: now, reviewerRating }
        : { status: 'reviewer_approved', reviewerComments: comments, reviewerActionDate: now, reviewerRating };
    } else {
      updates = type === 'return'
        ? { status: 'approver_returned', approverComments: comments, approverActionDate: now, approverRating }
        : { status: 'approver_approved', approverComments: comments, approverActionDate: now, approverRating };
    }

    setTimeout(() => {
      updateDemand(demand.id, updates);
      setActing(false);
      if (type === 'return') {
        showToast(`${demand.id} returned to ${role === 'reviewer' ? 'Initiator' : 'Reviewer'} with comments.`, 'warn');
      } else if (role === 'approver') {
        showToast(`${demand.id} approved! Moving to Demand Shaping.`, 'success');
      } else {
        showToast(`${demand.id} approved by Reviewer. Sent to Approver.`, 'success');
      }
      onActionDone();
    }, 600);
  };

  // ── Workflow step states ──────────────────────────────────────
  const wfStepState = (idx: number) => {
    const s = demand.status;
    if (idx === 0) return { done: true, active: false };
    if (idx === 1) return {
      done: ['reviewer_approved','approver_returned','approver_approved','demand_shaping'].includes(s),
      active: s === 'submitted',
    };
    if (idx === 2) return {
      done: ['approver_approved','demand_shaping'].includes(s),
      active: s === 'reviewer_approved',
    };
    return { done: s === 'demand_shaping', active: false };
  };

  return (
    <div className="drp-page">

      {/* ── Header ── */}
      <div className="cdp-header">
        <button className="cdp-back-btn" onClick={onBack} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {backLabel ?? 'Back'}
        </button>
        <div className="cdp-header-content">
          <div className="cdp-badge">
            {isInitiator ? 'Demand Details' : isReviewer ? 'Reviewer Action' : 'Approver Action'}
          </div>
          <h1 className="cdp-title">{demand.demandTitle}</h1>
          <p className="cdp-sub">{demand.id} · Submitted by {demand.initiatorName}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isEditable && onEdit && (
            <button className="drp-edit-btn" onClick={() => onEdit(demand)} type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Demand
            </button>
          )}
          <span className={`status-chip ${statusBadge}`}>{statusLabel}</span>
        </div>
      </div>

      <div className="drp-layout">

        {/* ── LEFT: Demand content ── */}
        <div className="drp-main">

          {/* Review trail */}
          {(demand.reviewerComments || demand.approverComments) && (
            <div className="drp-trail-card">
              <div className="drp-card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                Review Trail
              </div>
              {demand.reviewerComments && (
                <div className="drp-trail-item">
                  <div className="drp-trail-who">
                    Reviewer
                    {demand.reviewerActionDate && ` · ${new Date(demand.reviewerActionDate).toLocaleDateString()}`}
                  </div>
                  <div className="drp-trail-comment">{demand.reviewerComments}</div>
                </div>
              )}
              {demand.approverComments && (
                <div className="drp-trail-item">
                  <div className="drp-trail-who">
                    Approver
                    {demand.approverActionDate && ` · ${new Date(demand.approverActionDate).toLocaleDateString()}`}
                  </div>
                  <div className="drp-trail-comment">{demand.approverComments}</div>
                </div>
              )}
            </div>
          )}

          {/* Demand Summary — shown to reviewer/approver by default; initiator sees full details always */}
          {!isInitiator && (
            <div className="drp-summary-card">
              <div className="drp-summary-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Demand Summary
              </div>
              <div className="drp-summary-text">{demandSummary}</div>
              <button className="drp-details-toggle" onClick={() => setShowFullDetails(v => !v)} type="button">
                {showFullDetails ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                      <path d="M18 15l-6-6-6 6"/>
                    </svg>
                    Hide Full Details
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                    View Full Details
                  </>
                )}
              </button>
            </div>
          )}

          {/* Full details — always for initiator, toggled for reviewer/approver */}
          {(isInitiator || showFullDetails) && (
            <>
              <div className="drp-card">
                <div className="drp-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Basic Information
                </div>
                <FieldRow label="Demand Title"               value={demand.demandTitle} />
                <FieldRow label="Demand Reference"           value={demand.demandReference === 'new' ? 'New Demand' : demand.demandReference} />
                <FieldRow label="Current State"              value={demand.currentState} />
                <FieldRow label="Challenges / Gaps"          value={demand.challengesGaps} />
                <FieldRow label="Expected Delivery"          value={demand.expectedDelivery} />
                <FieldRow label="Business Rules / Validation" value={demand.businessRules} />
                <FieldRow label="Detailed Requirement"       value={demand.detailedRequirement} />
              </div>

              <div className="drp-card">
                <div className="drp-card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                  System Details
                </div>
                <div className="drp-fields-grid">
                  <FieldRow label="System Type"           value={demand.systemType} />
                  <FieldRow label={isNonSAP ? 'Platform' : 'Module'}           value={demand.module} />
                  <FieldRow label={isNonSAP ? 'Application Name' : 'Sub Module'} value={demand.subModule} />
                  <FieldRow label="Benefit Impact"        value={demand.benefitImpact} />
                  <FieldRow label="Benefit Type"          value={demand.benefitType} />
                  <FieldRow label="Target Value (AED)"    value={demand.targetValue ? (isNaN(Number(demand.targetValue)) ? demand.targetValue : `AED ${Number(demand.targetValue).toLocaleString()}`) : ''} />
                  <FieldRow label="Budget Availability"   value={demand.budgetAvailability} />
                  {demand.budgetAvailability === 'Yes' && <FieldRow label="Budget Code" value={demand.budgetCode} />}
                </div>
                <FieldRow label="Strategic Objectives"  value={demand.strategicObjectives} />
                <FieldRow label="Benefit Statement"     value={demand.benefitStatement} />
                <FieldRow label="Comments / Key Points" value={demand.commentsKeyPoints} />
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Action Panel ── */}
        <div className="drp-action-panel">

          {/* Initiator — show workflow only */}
          {isInitiator && (
            <div className="drp-workflow-card">
              <div className="drp-action-title">Submission Workflow</div>
              {WORKFLOW_STEPS.map((step, i) => {
                const { done, active } = wfStepState(i);
                return (
                  <div key={i} className="drp-wf-step">
                    <div className={`drp-wf-dot${done ? ' done' : active ? ' active' : ''}`}>
                      {done
                        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
                        : <span>{i + 1}</span>}
                    </div>
                    <div className={`drp-wf-label${active ? ' current' : done ? ' done-text' : ''}`}>{step.label}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reviewer / Approver — accordion sections */}
          {!isInitiator && (
            <>
              {/* Rating — separate accordion */}
              {(reviewerCanAct || approverCanAct) && (
                <div className="drp-accordion">
                  <div className="drp-accordion-hdr" onClick={() => setRatingOpen(v => !v)}>
                    <div className="drp-accordion-hdr-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      Rating
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"
                      className={`drp-accordion-chevron${ratingOpen ? ' open' : ''}`}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                  {ratingOpen && (
                    <div className="drp-accordion-body">
                      <div className="ddm-stars-wrap">
                        <div className="ddm-stars" onMouseLeave={() => setHoverStar(0)}>
                          {[1, 2, 3, 4, 5].map((star) => {
                            const currentRating = isReviewer ? reviewerRating : approverRating;
                            const filled = star <= (hoverStar || currentRating);
                            return (
                              <button key={star} type="button"
                                className={`ddm-star${filled ? ' filled' : ''}`}
                                onClick={() => isReviewer ? setReviewerRating(star) : setApproverRating(star)}
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
                          {(isReviewer ? reviewerRating : approverRating) > 0
                            ? `${isReviewer ? reviewerRating : approverRating}/5 — ${RATING_LABELS[isReviewer ? reviewerRating : approverRating]}`
                            : 'Click a star to rate'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reviewers accordion — only shown to reviewer role */}
              {isReviewer && <div className="drp-accordion">
                <div className="drp-accordion-hdr" onClick={() => setReviewerOpen(v => !v)}>
                  <div className="drp-accordion-hdr-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    Reviewers
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"
                    className={`drp-accordion-chevron${reviewerOpen ? ' open' : ''}`}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>

                {reviewerOpen && (
                  <div className="drp-accordion-body">
                    {reviewerCanAct ? (
                      <>
                        <div className="drp-acc-comments-lbl">
                          Comments{' '}
                          <span style={{ fontWeight: 400, color: '#9ca3af' }}>(required for Return)</span>
                        </div>
                        <textarea
                          className={`cdp-textarea${reviewerCommentError ? ' input-err' : ''}`}
                          rows={4}
                          placeholder="Add your review comments here…"
                          value={reviewerComments}
                          onChange={(e) => { setReviewerComments(e.target.value); setReviewerCommentError(''); }}
                        />
                        {reviewerCommentError && <div className="cdp-error">{reviewerCommentError}</div>}

                        <div className="drp-acc-btns">
                          <button className={`drp-btn-return${acting ? ' loading' : ''}`}
                            onClick={() => doAction('return', 'reviewer', reviewerComments, setReviewerCommentError)}
                            type="button" disabled={acting}>
                            {acting ? <span className="login-spinner" /> : (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                  <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/>
                                </svg>
                                Return
                              </>
                            )}
                          </button>
                          <button className={`drp-btn-approve${acting ? ' loading' : ''}`}
                            onClick={() => {
                              if (reviewerRating === 0) { showToast('Please provide a demand rating before approving.', 'warn'); return; }
                              doAction('approve', 'reviewer', reviewerComments, setReviewerCommentError);
                            }}
                            type="button" disabled={acting}>
                            {acting ? <span className="login-spinner" /> : (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Approve
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: '#9ca3af', paddingTop: 4 }}>
                        {demand.reviewerComments
                          ? `Reviewed${demand.reviewerActionDate ? ` on ${new Date(demand.reviewerActionDate).toLocaleDateString()}` : ''}.`
                          : 'No reviewer action required at this stage.'}
                      </div>
                    )}
                  </div>
                )}
              </div>}

              {/* Approvers accordion — only shown to approver role */}
              {isApprover && <div className="drp-accordion">
                <div className="drp-accordion-hdr" onClick={() => setApproverOpen(v => !v)}>
                  <div className="drp-accordion-hdr-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Approvers
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"
                    className={`drp-accordion-chevron${approverOpen ? ' open' : ''}`}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>

                {approverOpen && (
                  <div className="drp-accordion-body">
                    {approverCanAct ? (
                      <>
                        <div className="drp-acc-comments-lbl">
                          Comments{' '}
                          <span style={{ fontWeight: 400, color: '#9ca3af' }}>(required for Return)</span>
                        </div>
                        <textarea
                          className={`cdp-textarea${approverCommentError ? ' input-err' : ''}`}
                          rows={4}
                          placeholder="Add your approval comments here…"
                          value={approverComments}
                          onChange={(e) => { setApproverComments(e.target.value); setApproverCommentError(''); }}
                        />
                        {approverCommentError && <div className="cdp-error">{approverCommentError}</div>}

                        <div className="drp-acc-btns">
                          <button className={`drp-btn-return${acting ? ' loading' : ''}`}
                            onClick={() => doAction('return', 'approver', approverComments, setApproverCommentError)}
                            type="button" disabled={acting}>
                            {acting ? <span className="login-spinner" /> : (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                                  <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/>
                                </svg>
                                Return
                              </>
                            )}
                          </button>
                          <button className={`drp-btn-approve${acting ? ' loading' : ''}`}
                            onClick={() => {
                              if (approverRating === 0) { showToast('Please provide a demand rating before approving.', 'warn'); return; }
                              doAction('approve', 'approver', approverComments, setApproverCommentError);
                            }}
                            type="button" disabled={acting}>
                            {acting ? <span className="login-spinner" /> : (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Approve & Move to Shaping
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: '#9ca3af', paddingTop: 4 }}>
                        {demand.approverComments
                          ? `Actioned${demand.approverActionDate ? ` on ${new Date(demand.approverActionDate).toLocaleDateString()}` : ''}.`
                          : 'No approver action required at this stage.'}
                      </div>
                    )}
                  </div>
                )}
              </div>}

              {/* Workflow tracker */}
              <div className="drp-workflow-card">
                <div className="drp-action-title">Submission Workflow</div>
                {WORKFLOW_STEPS.map((step, i) => {
                  const { done, active } = wfStepState(i);
                  return (
                    <div key={i} className="drp-wf-step">
                      <div className={`drp-wf-dot${done ? ' done' : active ? ' active' : ''}`}>
                        {done
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
                          : <span>{i + 1}</span>}
                      </div>
                      <div className={`drp-wf-label${active ? ' current' : done ? ' done-text' : ''}`}>{step.label}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
