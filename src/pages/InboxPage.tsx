import { useState } from 'react';
import type { AuthUser, EnhancementDemand, ToastType } from '../types';
import {
  getDemandsByInitiator,
  getDemandsByReviewer,
  getDemandsByApprover,
  getStatusLabel,
  getStatusBadgeClass,
} from '../store';

interface InboxPageProps {
  currentUser: AuthUser;
  showToast: (message: string, type?: ToastType) => void;
  onOpenEnhancement: (d: EnhancementDemand) => void;
}

export default function InboxPage({
  currentUser,
  showToast: _showToast,
  onOpenEnhancement,
}: InboxPageProps) {
  const [inboxView, setInboxView] = useState<'grid' | 'list'>('grid');
  const [inboxSearch, setInboxSearch] = useState('');

  // Enhancement demands for this user's inbox
  const enhancementInboxItems: EnhancementDemand[] = (() => {
    if (currentUser.role === 'initiator') {
      return getDemandsByInitiator(currentUser.username).filter(
        (d) => d.status === 'reviewer_returned' || d.status === 'approver_returned'
      );
    }
    if (currentUser.role === 'reviewer') {
      return getDemandsByReviewer(currentUser.username).filter(
        (d) => d.status === 'submitted'
      );
    }
    if (currentUser.role === 'approver') {
      return getDemandsByApprover(currentUser.username).filter(
        (d) => d.status === 'reviewer_approved'
      );
    }
    return [];
  })();

  const filteredEnhancement = enhancementInboxItems.filter((d) => {
    const q = inboxSearch.toLowerCase();
    return (
      !q ||
      d.demandTitle.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      d.initiatorName.toLowerCase().includes(q)
    );
  });

  const inboxLabel = (() => {
    if (currentUser.role === 'initiator') return 'Demands returned to you for revision';
    if (currentUser.role === 'reviewer') return 'Demands awaiting your review';
    return 'Demands awaiting your final approval';
  })();

  return (
    <div className="inbox-wrap">
      <div className="inbox-phdr">
        <div className="inbox-title">Inbox</div>
      </div>
      <div className="inbox-sub">{inboxLabel}</div>

      {/* Controls */}
      <div className="inbox-ctrl">
        <div className="pending-lbl">
          Pending Items
          <span className="pct-badge">{filteredEnhancement.length}</span>
        </div>
        <div className="ctrl-sp" />
        <div className="vt-wrap">
          <button
            className={`vt-btn${inboxView === 'grid' ? ' active' : ''}`}
            onClick={() => setInboxView('grid')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            Cards
          </button>
          <button
            className={`vt-btn${inboxView === 'list' ? ' active' : ''}`}
            onClick={() => setInboxView('list')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            List
          </button>
        </div>
        <div className="srch-box">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Search inbox…"
            value={inboxSearch}
            onChange={(e) => setInboxSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Enhancement Demands */}
      {filteredEnhancement.length === 0 ? (
        <div className="ws-empty" style={{ paddingTop: 60 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
            <polyline points="3 9 12 15 21 9" />
            <path d="M21 9V19a2 2 0 01-2 2H5a2 2 0 01-2-2V9" />
          </svg>
          <div className="ws-empty-title">
            {inboxSearch
              ? 'No demands match your search.'
              : 'Your inbox is empty — no pending items.'}
          </div>
        </div>
      ) : inboxView === 'grid' ? (
        <div className="inbox-grid">
          {filteredEnhancement.map((d) => (
            <div
              key={d.id}
              className="inbox-card"
              onClick={() => onOpenEnhancement(d)}
              style={{ cursor: 'pointer' }}
            >
              <div className="ic-top">
                <div className="ic-no">{d.id}</div>
                <span className={`status-chip ${getStatusBadgeClass(d.status)}`}>
                  {getStatusLabel(d.status)}
                </span>
              </div>
              <div className="ic-title">{d.demandTitle}</div>
              <div className="ic-meta-row">
                <div className="ic-meta">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  {d.initiatorName}
                </div>
                <div className="ic-meta">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {new Date(d.createdAt).toLocaleDateString()}
                </div>
                {d.systemType && (
                  <div className="ic-meta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                    </svg>
                    {d.systemType}
                  </div>
                )}
              </div>
              {currentUser.role === 'initiator' && d.reviewerComments && (
                <div className="ic-return-comment">
                  <strong>Reviewer note:</strong> {d.reviewerComments}
                </div>
              )}
              {currentUser.role === 'initiator' && d.approverComments && (
                <div className="ic-return-comment">
                  <strong>Approver note:</strong> {d.approverComments}
                </div>
              )}
              <div className="ic-actions">
                {currentUser.role === 'initiator' ? (
                  <button className="btn-view" onClick={(e) => { e.stopPropagation(); onOpenEnhancement(d); }}>
                    View &amp; Edit →
                  </button>
                ) : (
                  <>
                    <button
                      className="btn-approve"
                      onClick={(e) => { e.stopPropagation(); onOpenEnhancement(d); }}
                    >
                      Review &amp; Decide
                    </button>
                    <button className="btn-view" onClick={(e) => { e.stopPropagation(); onOpenEnhancement(d); }}>
                      View Details
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="inbox-list">
          <table>
            <thead>
              <tr>
                <th>Demand No.</th>
                <th>Demand Title</th>
                <th>Status</th>
                <th>Initiator</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnhancement.map((d) => (
                <tr key={d.id} className="inbox-list-row" onClick={() => onOpenEnhancement(d)}>
                  <td className="td-no">{d.id}</td>
                  <td className="td-name">{d.demandTitle}</td>
                  <td>
                    <span className={`status-chip ${getStatusBadgeClass(d.status)}`}>
                      {getStatusLabel(d.status)}
                    </span>
                  </td>
                  <td className="td-lead">{d.initiatorName}</td>
                  <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-view"
                      style={{ flex: 'none', padding: '7px 14px', fontSize: 11 }}
                      onClick={(e) => { e.stopPropagation(); onOpenEnhancement(d); }}
                    >
                      {currentUser.role === 'initiator' ? 'View & Edit' : 'Review & Decide'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
