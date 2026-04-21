import { useState, useCallback, useRef } from 'react';
import './index.css';
import './agents.css';

import { getSession } from './auth';
import type { AuthUser, EnhancementDemand, TabId, ToastType } from './types';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import InboxPage from './pages/InboxPage';
import CreateDemandPage from './pages/CreateDemandPage';
import DemandReviewPage from './pages/DemandReviewPage';

import { getDemandsByInitiator, getDemandsByReviewer, getDemandsByApprover, seedIfEmpty } from './store';

// Seed localStorage from JSON file on first load
seedIfEmpty();

type CurrentPage = TabId | 'create-demand' | 'review-demand';

export default function App() {
  // ── Auth ──
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getSession);

  const handleLogin = (user: AuthUser) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);

  // ── Tab / Page ──
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [currentPage, setCurrentPage] = useState<CurrentPage>('home');

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setCurrentPage(tab);
    setReviewDemand(null);
    // Close sidebar on mobile when navigating
    if (window.innerWidth <= 640) setSidebarOpen(false);
  };

  // ── Toast ──
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, visible: true });
    toastTimer.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3400);
  }, []);

  // ── Enhancement demand review page ──
  const [reviewDemand, setReviewDemand] = useState<EnhancementDemand | null>(null);
  const [editDemand, setEditDemand]     = useState<EnhancementDemand | null>(null);

  const openEnhancement = (d: EnhancementDemand) => {
    setReviewDemand(d);
    setCurrentPage('review-demand');
  };

  const handleEditDemand = (d: EnhancementDemand) => {
    setEditDemand(d);
    setReviewDemand(null);
    setCurrentPage('create-demand');
  };

  // ── Create demand ──
  const handleCreateDemand = () => { setEditDemand(null); setCurrentPage('create-demand'); };

  const handleBackFromCreate = () => {
    setEditDemand(null);
    setCurrentPage('workspace');
    setActiveTab('workspace');
  };

  const handleBackFromReview = () => {
    setCurrentPage(activeTab);
    setReviewDemand(null);
  };

  const handleReviewActionDone = () => {
    setCurrentPage(activeTab);
    setReviewDemand(null);
  };

  // ── Sidebar — closed by default on mobile ──
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 640);

  // ── Step (HomePage accordion) ──
  const [openStepIndex, setOpenStepIndex] = useState<number | null>(null);

  // ── Inbox count for badge ──
  const inboxCount = (() => {
    if (!currentUser) return 0;
    if (currentUser.role === 'initiator')
      return getDemandsByInitiator(currentUser.username).filter(
        (d) => d.status === 'reviewer_returned' || d.status === 'approver_returned'
      ).length;
    if (currentUser.role === 'reviewer')
      return getDemandsByReviewer(currentUser.username).filter(
        (d) => d.status === 'submitted'
      ).length;
    if (currentUser.role === 'approver')
      return getDemandsByApprover(currentUser.username).filter(
        (d) => d.status === 'reviewer_approved'
      ).length;
    return 0;
  })();

  // ── Not logged in ──
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const mobileSidebarOverlay = sidebarOpen && (
    <div className="sb-mobile-overlay" onClick={() => setSidebarOpen(false)} />
  );

  // ── Create Demand full screen ──
  if (currentPage === 'create-demand') {
    return (
      <>
        <div className="bg"><div className="bg-blob b1" /><div className="bg-blob b2" /><div className="bg-blob b3" /></div>
        <div className="app">
          {mobileSidebarOverlay}
          <Sidebar activeTab={activeTab} onTabChange={handleTabChange} currentUser={currentUser} inboxCount={inboxCount} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Header
              activeTab={activeTab}
              currentUser={currentUser}
              onRefresh={() => showToast('Refreshed')}
              onLogout={handleLogout}
              showToast={showToast}
              currentPage="create-demand"
              pageLabel={editDemand ? `Editing ${editDemand.id}` : undefined}
              onMenuToggle={() => setSidebarOpen(v => !v)}
            />
            <main className="content">
              <CreateDemandPage currentUser={currentUser} onBack={handleBackFromCreate} showToast={showToast} editDemand={editDemand ?? undefined} />
            </main>
          </div>
        </div>
        <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      </>
    );
  }

  // ── Review/Approve Demand full screen ──
  if (currentPage === 'review-demand' && reviewDemand) {
    return (
      <>
        <div className="bg"><div className="bg-blob b1" /><div className="bg-blob b2" /><div className="bg-blob b3" /></div>
        <div className="app">
          {mobileSidebarOverlay}
          <Sidebar activeTab={activeTab} onTabChange={handleTabChange} currentUser={currentUser} inboxCount={inboxCount} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Header activeTab={activeTab} currentUser={currentUser} onRefresh={() => showToast('Refreshed')} onLogout={handleLogout} showToast={showToast} currentPage="review-demand" onMenuToggle={() => setSidebarOpen(v => !v)} />
            <main className="content">
              <DemandReviewPage
                demand={reviewDemand}
                currentUser={currentUser}
                onBack={handleBackFromReview}
                backLabel={activeTab === 'workspace' ? 'Back to Workspace' : 'Back to Inbox'}
                showToast={showToast}
                onActionDone={handleReviewActionDone}
                onEdit={handleEditDemand}
              />
            </main>
          </div>
        </div>
        <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      </>
    );
  }

  // ── Main app ──
  return (
    <>
      <div className="bg">
        <div className="bg-blob b1" />
        <div className="bg-blob b2" />
        <div className="bg-blob b3" />
      </div>

      <div className="app">
        {mobileSidebarOverlay}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentUser={currentUser}
          inboxCount={inboxCount}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header
            activeTab={activeTab}
            currentUser={currentUser}
            onRefresh={() => showToast('Data refreshed', 'success')}
            onLogout={handleLogout}
            showToast={showToast}
            onMenuToggle={() => setSidebarOpen(v => !v)}
          />

          <main className="content">
            <div className={`tab-pane${activeTab === 'home' ? ' active' : ''}`}>
              <HomePage
                onTabChange={handleTabChange}
                showToast={showToast}
                openStepIndex={openStepIndex}
                setOpenStepIndex={setOpenStepIndex}
                inboxCount={inboxCount}
              />
            </div>

            <div className={`tab-pane${activeTab === 'workspace' ? ' active' : ''}`}>
              <WorkspacePage
                currentUser={currentUser}
                onCreateDemand={handleCreateDemand}
                showToast={showToast}
                onOpenEnhancement={openEnhancement}
              />
            </div>

            <div className={`tab-pane${activeTab === 'inbox' ? ' active' : ''}`}>
              <InboxPage
                currentUser={currentUser}
                showToast={showToast}
                onOpenEnhancement={openEnhancement}
              />
            </div>
          </main>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </>
  );
}
