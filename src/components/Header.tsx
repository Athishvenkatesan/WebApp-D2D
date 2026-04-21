import type { AuthUser, TabId, ToastType } from '../types';
import { logout } from '../auth';

interface HeaderProps {
  activeTab: TabId;
  currentUser: AuthUser;
  onRefresh: () => void;
  onLogout: () => void;
  showToast: (message: string, type?: ToastType) => void;
  currentPage?: string;
  pageLabel?: string;
  onMenuToggle?: () => void;
}

const TAB_LABELS: Record<string, string> = {
  home: 'Home',
  workspace: 'Demand Workspace',
  inbox: 'Inbox',
  'create-demand': 'New Enhancement Demand',
  'review-demand': 'Demand Review',
};

export default function Header({ activeTab, currentUser, onRefresh, onLogout, currentPage, pageLabel, onMenuToggle }: HeaderProps) {
  const breadcrumb = pageLabel || (currentPage ? TAB_LABELS[currentPage] : TAB_LABELS[activeTab]);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <header className="header">
      {/* Hamburger — mobile only */}
      {onMenuToggle && (
        <button className="hdr-menu-btn" onClick={onMenuToggle} title="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="18" height="18">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* DEWA Logo — actual image */}
      <div className="hdr-dewa">
        <img src="/dewa-logo.png" alt="DEWA" className="hdr-dewa-img" />
      </div>

      <div className="hdr-divider" />

      {/* Breadcrumb */}
      <div className="hdr-bc">
        <span className="hbc-home">DEWA</span>
        <span className="hbc-sep">›</span>
        <span className="hbc-cur">{breadcrumb}</span>
      </div>

      <div className="hsp" />

      {/* Right controls */}
      <div className="hdr-right">
        <span className="env-badge">DEV v1.1.0</span>

        <div className="hib" title="Refresh" onClick={onRefresh}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </div>

        <div className="hdr-user-chip">
          <div className="hdr-user-av">{currentUser.initials}</div>
          <div className="hdr-user-info">
            <div className="hdr-user-name">{currentUser.name}</div>
            <div className="hdr-user-role">{currentUser.title}</div>
          </div>
        </div>

        <div className="hib hib-logout" title="Sign Out" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
      </div>
    </header>
  );
}
