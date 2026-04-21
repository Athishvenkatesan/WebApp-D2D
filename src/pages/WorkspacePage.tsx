import { useState } from 'react';
import type { AuthUser, EnhancementDemand, ToastType } from '../types';
import {
  getDemandsByInitiator,
  getDemandsByReviewer,
  getDemandsByApprover,
  getStatusLabel,
  getStatusBadgeClass,
} from '../store';
import type { DemandSubmissionStatus } from '../types';

interface WorkspacePageProps {
  currentUser: AuthUser;
  onCreateDemand: () => void;
  showToast: (message: string, type?: ToastType) => void;
  onOpenEnhancement: (d: EnhancementDemand) => void;
}

type FilterKey = 'all' | 'draft' | 'in-review' | 'in-approval' | 'approved' | 'returned';

const FILTER_MAP: Record<FilterKey, DemandSubmissionStatus[]> = {
  all: [],
  draft: ['draft'],
  'in-review': ['submitted'],
  'in-approval': ['reviewer_approved'],
  approved: ['approver_approved', 'demand_shaping'],
  returned: ['reviewer_returned', 'approver_returned'],
};

const PILL_LABELS: Record<FilterKey, string> = {
  all: 'All',
  draft: 'Draft',
  'in-review': 'In Review',
  'in-approval': 'In Approval',
  approved: 'Approved',
  returned: 'Returned',
};

function DemandRating({ demand }: { demand: EnhancementDemand }) {
  const ratings: number[] = [];
  if (demand.reviewerRating > 0) ratings.push(demand.reviewerRating);
  if (demand.approverRating > 0) ratings.push(demand.approverRating);
  if (ratings.length === 0) {
    return <span className="tbl-rating-none">No ratings</span>;
  }
  const avg = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
  return (
    <div className="tbl-rating">
      <div className="tbl-stars">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} className={`tbl-star${s <= avg ? ' filled' : ''}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill={s <= avg ? 'currentColor' : 'none'}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      <span className="tbl-rating-meta">({ratings.length})</span>
    </div>
  );
}

export default function WorkspacePage({
  currentUser,
  onCreateDemand,
  showToast: _showToast,
  onOpenEnhancement,
}: WorkspacePageProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const isInitiator = currentUser.role === 'initiator';

  const allDemands: EnhancementDemand[] = (() => {
    if (currentUser.role === 'initiator') return getDemandsByInitiator(currentUser.username);
    if (currentUser.role === 'reviewer') return getDemandsByReviewer(currentUser.username);
    if (currentUser.role === 'approver') return getDemandsByApprover(currentUser.username);
    return [];
  })();

  // Status counts
  const draftCount = allDemands.filter(d => d.status === 'draft').length;
  const returnedCount = allDemands.filter(d => d.status === 'reviewer_returned' || d.status === 'approver_returned').length;
  const inReviewCount = allDemands.filter(d => d.status === 'submitted').length;
  const inApprovalCount = allDemands.filter(d => d.status === 'reviewer_approved').length;
  const approvedCount = allDemands.filter(d => d.status === 'approver_approved' || d.status === 'demand_shaping').length;
  const shapingCount = allDemands.filter(d => d.status === 'demand_shaping' || d.status === 'approver_approved').length;

  // Apply filter + search
  const filtered = allDemands.filter((d) => {
    const matchFilter = filter === 'all' || FILTER_MAP[filter].includes(d.status);
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.demandTitle.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.initiatorName.toLowerCase().includes(q) ||
      (d.systemType || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const total = allDemands.length;
  const maxPipelineCount = Math.max(inApprovalCount, shapingCount, 1);

  const pipelineStages = [
    { label: 'Approval Pending', shortLabel: 'Approval', count: inApprovalCount, color: '#3b82f6' },
    { label: 'Demand Shaping / Solutioning', shortLabel: 'Shaping', count: shapingCount, color: '#f59e0b' },
    { label: 'Planning / Technology Sourcing', shortLabel: 'Planning', count: 0, color: '#14b8a6' },
    { label: 'Execution', shortLabel: 'Execution', count: 0, color: '#7c3aed' },
    { label: 'Completed', shortLabel: 'Done', count: 0, color: '#22c55e' },
  ];

  return (
    <div className="wsp-page">
      {/* Page Header */}
      <div className="wsp-page-hdr">
        <div>
          <div className="wsp-title">Demand Workspace</div>
          <div className="wsp-sub">
            {isInitiator
              ? 'Your submitted demands and pipeline overview'
              : currentUser.role === 'reviewer'
              ? 'Demands assigned to you for review'
              : 'Demands pending your approval'}
          </div>
        </div>
        {isInitiator && (
          <button className="btn-create" onClick={onCreateDemand}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Demand
          </button>
        )}
      </div>

      {/* ── Status Overview ── */}
      <div className="wsp-section-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        Status Overview
      </div>
      <div className="wsp-cards-row">
        {/* Total Demands */}
        <div
          className={`wsp-card wsp-card-blue${filter === 'all' ? ' wsp-card-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <div className="wsp-card-top">
            <span className="wsp-card-num">{total}</span>
            <div className="wsp-card-ico" style={{ background: '#dbeafe' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" width="18" height="18">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
          </div>
          <div className="wsp-card-lbl">Total Demands</div>
          {total > 0 && <div className="wsp-card-note" style={{ color: '#1a7a4e' }}>↑ {total} total</div>}
        </div>
        {/* Draft */}
        <div
          className={`wsp-card wsp-card-amber${filter === 'draft' ? ' wsp-card-active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          <div className="wsp-card-top">
            <span className="wsp-card-num">{draftCount}</span>
            <div className="wsp-card-ico" style={{ background: '#fef3c7' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" width="18" height="18">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
          </div>
          <div className="wsp-card-lbl">Draft</div>
        </div>
        {/* Returned */}
        <div
          className={`wsp-card wsp-card-red${filter === 'returned' ? ' wsp-card-active' : ''}`}
          onClick={() => setFilter('returned')}
        >
          <div className="wsp-card-top">
            <span className="wsp-card-num">{returnedCount}</span>
            <div className="wsp-card-ico" style={{ background: '#fee2e2' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
          </div>
          <div className="wsp-card-lbl">Returned / Rejected</div>
        </div>
        {/* Review In Progress */}
        <div
          className={`wsp-card wsp-card-teal${filter === 'in-review' ? ' wsp-card-active' : ''}`}
          onClick={() => setFilter('in-review')}
        >
          <div className="wsp-card-top">
            <span className="wsp-card-num">{inReviewCount}</span>
            <div className="wsp-card-ico" style={{ background: '#ccfbf1' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" width="18" height="18">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
          </div>
          <div className="wsp-card-lbl">Review In Progress</div>
        </div>
        {/* Approval in Progress */}
        <div
          className={`wsp-card wsp-card-purple${filter === 'in-approval' ? ' wsp-card-active' : ''}`}
          onClick={() => setFilter('in-approval')}
        >
          <div className="wsp-card-top">
            <span className="wsp-card-num">{inApprovalCount}</span>
            <div className="wsp-card-ico" style={{ background: '#ede9fe' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" width="18" height="18">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
          </div>
          <div className="wsp-card-lbl">Approval in Progress</div>
        </div>
      </div>

      {/* ── Pipeline Stages ── */}
      <div className="wsp-section-label" style={{ marginTop: 20 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Pipeline Stages
      </div>
      <div className="wsp-cards-row">
        <div className="wsp-card wsp-card-blue">
          <div className="wsp-card-top">
            <span className="wsp-card-num">{inApprovalCount}</span>
            <div className="wsp-card-ico" style={{ background: '#dbeafe' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
          </div>
          <div className="wsp-card-lbl">Approval Pending</div>
        </div>
        <div className="wsp-card wsp-card-amber">
          <div className="wsp-card-top">
            <span className="wsp-card-num">{shapingCount}</span>
            <div className="wsp-card-ico" style={{ background: '#fef3c7' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" width="18" height="18">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
          </div>
          <div className="wsp-card-lbl">Demand Shaping / Solutioning</div>
        </div>
        <div className="wsp-card wsp-card-teal">
          <div className="wsp-card-top">
            <span className="wsp-card-num">0</span>
            <div className="wsp-card-ico" style={{ background: '#ccfbf1' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" width="18" height="18">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
          </div>
          <div className="wsp-card-lbl">Planning / Technology Sourcing</div>
        </div>
        <div className="wsp-card wsp-card-purple">
          <div className="wsp-card-top">
            <span className="wsp-card-num">0</span>
            <div className="wsp-card-ico" style={{ background: '#ede9fe' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" width="18" height="18">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
          </div>
          <div className="wsp-card-lbl">Execution</div>
        </div>
        <div className="wsp-card wsp-card-green">
          <div className="wsp-card-top">
            <span className="wsp-card-num">{approvedCount}</span>
            <div className="wsp-card-ico" style={{ background: '#dcfce7' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="18" height="18">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>
          <div className="wsp-card-lbl">Completed</div>
          {approvedCount > 0 && <div className="wsp-card-note" style={{ color: '#22c55e' }}>✓ Delivered</div>}
        </div>
      </div>

      {/* ── Charts Row ── */}
      {total > 0 && (
        <div className="wsp-charts-row">
          {/* Bar Chart */}
          <div className="wsp-chart-card">
            <div className="wsp-chart-title">Demand Distribution by Stage</div>
            <div className="wsp-chart-sub">Current pipeline — all {total} demands</div>
            <div className="wsp-bar-chart">
              {pipelineStages.map((s) => {
                const barH = s.count > 0 ? Math.max(28, Math.round((s.count / maxPipelineCount) * 110)) : 6;
                return (
                  <div key={s.shortLabel} className="wsp-bar-col">
                    <span className="wsp-bar-num" style={{ color: s.count > 0 ? s.color : '#9ca3af' }}>
                      {s.count > 0 ? s.count : ''}
                    </span>
                    <div
                      className="wsp-bar"
                      style={{
                        height: barH,
                        background: s.count > 0 ? s.color : '#e5e7eb',
                        borderRadius: s.count > 0 ? '6px 6px 0 0' : 4,
                      }}
                    />
                    <span className="wsp-bar-lbl">{s.shortLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Progress Tracker */}
          <div className="wsp-chart-card">
            <div className="wsp-chart-title">Stage Progress Tracker</div>
            <div className="wsp-chart-sub">Proportional view — out of {total} total</div>
            <div className="wsp-progress-list">
              {pipelineStages.map((s) => (
                <div key={s.label} className="wsp-progress-row">
                  <span className="wsp-progress-lbl">{s.label.split(' / ')[0]}</span>
                  <div className="wsp-progress-track">
                    <div
                      className="wsp-progress-fill"
                      style={{
                        width: total > 0 ? `${Math.round((s.count / total) * 100)}%` : '0%',
                        background: s.color,
                      }}
                    />
                  </div>
                  <span className="wsp-progress-count">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── All Demands Table ── */}
      <div className="wsp-table-card">
        <div className="wsp-table-hdr">
          <div>
            <div className="wsp-table-title">
              All Demands
              <span className="wsp-table-count">({filtered.length})</span>
            </div>
            <div className="wsp-table-sub">Click any row to view details · Click status cards above to filter</div>
          </div>
          <div className="wsp-table-controls">
            {/* Filter pills */}
            <div className="tbl-filter">
              {(Object.keys(PILL_LABELS) as FilterKey[]).map((key) => (
                <button
                  key={key}
                  className={`fl-btn${filter === key ? ' on' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {PILL_LABELS[key]}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="sb">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                placeholder="Search demands…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="ws-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="44" height="44">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="ws-empty-title">
              {allDemands.length === 0
                ? isInitiator
                  ? 'No demands yet — click "Create Demand" to get started.'
                  : 'No demands assigned to you currently.'
                : 'No demands match the current filter.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table id="dtable">
              <thead>
                <tr>
                  <th>Demand No.</th>
                  <th>Demand Title</th>
                  <th>Initiator</th>
                  <th>System Type</th>
                  <th>Submitted</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} onClick={() => onOpenEnhancement(d)}>
                    <td className="td-no">{d.id}</td>
                    <td className="td-name">{d.demandTitle}</td>
                    <td className="td-lead">{d.initiatorName}</td>
                    <td>
                      {d.systemType
                        ? <span className="sys-type-badge">{d.systemType}</span>
                        : <span style={{ color: 'var(--ez-text-muted)' }}>—</span>}
                    </td>
                    <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</td>
                    <td><DemandRating demand={d} /></td>
                    <td>
                      <span className={`status-chip ${getStatusBadgeClass(d.status)}`}>
                        {getStatusLabel(d.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="ra-btn ra-view"
                        onClick={(e) => { e.stopPropagation(); onOpenEnhancement(d); }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
