import type { EnhancementDemand, DemandSubmissionStatus } from './types';
import seedDemands from './data/enhancementDemands.json';

const KEY = 'd2d_enhancement_demands';

function load(): EnhancementDemand[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as EnhancementDemand[]) : [];
  } catch {
    return [];
  }
}

function save(demands: EnhancementDemand[]): void {
  localStorage.setItem(KEY, JSON.stringify(demands));
}

/** Seeds localStorage from the JSON file if the store is empty. Call once at app startup. */
export function seedIfEmpty(): void {
  const existing = load();
  if (existing.length === 0) {
    save(seedDemands as EnhancementDemand[]);
  }
}

/** Wipes localStorage and reloads all seed data from the JSON file. */
export function resetToDefaults(): void {
  save(seedDemands as EnhancementDemand[]);
}

export function getAllDemands(): EnhancementDemand[] {
  return load();
}

export function getDemandById(id: string): EnhancementDemand | undefined {
  return load().find((d) => d.id === id);
}

export function getDemandsByInitiator(username: string): EnhancementDemand[] {
  return load().filter((d) => d.initiatorUsername === username);
}

export function getDemandsByReviewer(username: string): EnhancementDemand[] {
  return load().filter((d) => d.reviewerUsername === username);
}

export function getDemandsByApprover(username: string): EnhancementDemand[] {
  return load().filter((d) => d.approverUsername === username);
}

export function createDemand(demand: EnhancementDemand): void {
  const all = load();
  all.unshift(demand);
  save(all);
}

export function updateDemand(id: string, updates: Partial<EnhancementDemand>): void {
  const all = load().map((d) =>
    d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
  );
  save(all);
}

export function deleteDemand(id: string): void {
  save(load().filter((d) => d.id !== id));
}

export function generateId(): string {
  const all = load();
  const year = new Date().getFullYear();
  const next = all.length + 1;
  return `ENH-${year}-${String(next).padStart(3, '0')}`;
}

export function getStatusLabel(status: DemandSubmissionStatus): string {
  const map: Record<DemandSubmissionStatus, string> = {
    draft: 'Draft',
    submitted: 'Pending Review',
    reviewer_returned: 'Returned by Reviewer',
    reviewer_approved: 'Pending Approval',
    approver_returned: 'Returned by Approver',
    approver_approved: 'Approved',
    demand_shaping: 'Demand Shaping',
  };
  return map[status] ?? status;
}

export function getStatusBadgeClass(status: DemandSubmissionStatus): string {
  const map: Record<DemandSubmissionStatus, string> = {
    draft: 'badge-gray',
    submitted: 'badge-blue',
    reviewer_returned: 'badge-red',
    reviewer_approved: 'badge-amber',
    approver_returned: 'badge-red',
    approver_approved: 'badge-green',
    demand_shaping: 'badge-purple',
  };
  return map[status] ?? 'badge-gray';
}
