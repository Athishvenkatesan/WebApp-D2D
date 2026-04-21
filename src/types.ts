export type UserRole = 'initiator' | 'reviewer' | 'approver';

export interface AuthUser {
  username: string;
  name: string;
  role: UserRole;
  initials: string;
  title: string;
}

// ── Legacy demand types (workspace / home) ──
export interface Demand {
  id: string;
  name: string;
  lead: string;
  submitted: string;
  goLive: string;
  status: string;
  statusLabel: string;
  stage: 'Review' | 'Approval' | 'Returned' | 'Progress' | 'Draft';
}

export interface InboxItem {
  id: string;
  name: string;
  statusLabel: string;
  initiator: string;
  date: string;
  demandData: Demand;
}

export interface StepDetail {
  title: string;
  text: string;
  tags: string[];
}

export type ToastType = 'success' | 'warn' | 'err';

export type TabId = 'home' | 'workspace' | 'inbox';

// ── Enhancement Demand Submission ──
export type DemandSubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'reviewer_returned'
  | 'reviewer_approved'
  | 'approver_returned'
  | 'approver_approved'
  | 'demand_shaping';

export interface EnhancementDemand {
  id: string;
  createdAt: string;
  updatedAt: string;

  initiatorUsername: string;
  initiatorName: string;
  reviewerUsername: string;
  approverUsername: string;

  status: DemandSubmissionStatus;
  reviewerComments: string;
  approverComments: string;
  reviewerActionDate: string;
  approverActionDate: string;
  reviewerRating: number;
  approverRating: number;

  // Basic Information
  demandTitle: string;
  demandReference: string;
  currentState: string;
  challengesGaps: string;
  expectedDelivery: string;
  businessRules: string;
  detailedRequirement: string;

  // System Details
  systemType: 'SAP' | 'Non-SAP' | '';
  module: string;
  subModule: string;
  strategicObjectives: string;
  benefitImpact: string;
  benefitType: string;
  benefitStatement: string;
  targetValue: string;
  budgetAvailability: 'Yes' | 'No' | '';
  budgetCode: string;
  commentsKeyPoints: string;
  attachments: string[];
}
