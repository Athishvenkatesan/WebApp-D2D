import type { AuthUser, TabId } from '../types';
import { ROLE_LABELS } from '../auth';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  currentUser: AuthUser;
  inboxCount: number;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ activeTab, onTabChange, currentUser, inboxCount, isOpen, onToggle }: SidebarProps) {
  const isInitiator = currentUser.role === 'initiator';
  const isReviewer = currentUser.role === 'reviewer';
  const isApprover = currentUser.role === 'approver';

  const cls = `sidebar${isOpen ? '' : ' sidebar-collapsed'}`;

  return (
    <aside className={cls}>
      {/* Logo area with toggle */}
      <div className="sb-logo sb-logo-blank">
        <button className="sb-toggle-btn" onClick={onToggle} title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        {isOpen && <div className="nav-lbl">Main</div>}

        <button
          className={`nav-btn${activeTab === 'home' ? ' active' : ''}`}
          onClick={() => onTabChange('home')}
          title={isOpen ? undefined : 'Home'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {isOpen && <span className="sb-nav-text">Home</span>}
        </button>

        <button
          className={`nav-btn${activeTab === 'workspace' ? ' active' : ''}`}
          onClick={() => onTabChange('workspace')}
          title={isOpen ? undefined : 'Demand Workspace'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          {isOpen && <span className="sb-nav-text">Demand Workspace</span>}
        </button>

        <button
          className={`nav-btn${activeTab === 'inbox' ? ' active' : ''}`}
          onClick={() => onTabChange('inbox')}
          title={isOpen ? undefined : 'Inbox'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 9 12 15 21 9" />
            <path d="M21 9V19a2 2 0 01-2 2H5a2 2 0 01-2-2V9" />
          </svg>
          {isOpen && <span className="sb-nav-text">Inbox</span>}
          {inboxCount > 0 && <span className="nb">{inboxCount}</span>}
        </button>

        {isOpen && <div className="nav-lbl" style={{ marginTop: 6 }}>Tools</div>}

        <button className="nav-btn nav-btn-disabled" title={isOpen ? undefined : 'Analytics (Soon)'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          {isOpen && <><span className="sb-nav-text">Analytics</span><span className="nav-soon">Soon</span></>}
        </button>

        <button className="nav-btn nav-btn-disabled" title={isOpen ? undefined : 'Settings (Soon)'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M21 12h-2M5 12H3M12 21v-2M12 5V3" />
          </svg>
          {isOpen && <><span className="sb-nav-text">Settings</span><span className="nav-soon">Soon</span></>}
        </button>

        {/* Role info — only when expanded */}
        {isOpen && (
          <div className="sb-role-info">
            <div className="sb-role-label">Your Role</div>
            <div className="sb-role-name">{ROLE_LABELS[currentUser.role]}</div>
            <div className="sb-role-desc">
              {isInitiator && 'Submit and track enhancement demands'}
              {isReviewer && 'Review submitted demands and send to approver'}
              {isApprover && 'Final approval before Demand Shaping'}
            </div>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="sb-user">
        <div className="u-av">{currentUser.initials}</div>
        {isOpen && (
          <>
            <div>
              <div className="u-name">{currentUser.name}</div>
              <div className="u-role">{ROLE_LABELS[currentUser.role]}</div>
            </div>
            <div className="u-dot" title="Online" />
          </>
        )}
      </div>
    </aside>
  );
}
