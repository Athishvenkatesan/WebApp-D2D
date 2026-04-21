import type { AuthUser, UserRole } from './types';
import usersData from './data/users.json';

interface UserRecord {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  initials: string;
  title: string;
}

const CREDENTIALS = usersData as UserRecord[];

export const ROLE_LABELS: Record<UserRole, string> = {
  initiator: 'Initiator / Requester',
  reviewer: 'Reviewer',
  approver: 'Approver',
};

export function login(username: string, password: string): AuthUser | null {
  const found = CREDENTIALS.find(
    (c) => c.username === username && c.password === password
  );
  if (!found) return null;
  const user: AuthUser = {
    username: found.username,
    name: found.name,
    role: found.role,
    initials: found.initials,
    title: found.title,
  };
  localStorage.setItem('d2d_auth', JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem('d2d_auth');
}

export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem('d2d_auth');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getReviewers(): AuthUser[] {
  return CREDENTIALS.filter((c) => c.role === 'reviewer').map((c) => ({
    username: c.username,
    name: c.name,
    role: c.role,
    initials: c.initials,
    title: c.title,
  }));
}

export function getApprovers(): AuthUser[] {
  return CREDENTIALS.filter((c) => c.role === 'approver').map((c) => ({
    username: c.username,
    name: c.name,
    role: c.role,
    initials: c.initials,
    title: c.title,
  }));
}
