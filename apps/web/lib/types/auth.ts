'use client';

import type { UserRole } from '@/lib/roles';

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole | null;
  orgId: string | null;
  orgName: string | null;
  isDevUser: boolean;
};
