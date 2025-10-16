import type { UserRole } from './roles';

export const mockUser: {
  id: string;
  name: string;
  role: UserRole;
  orgId: string;
  orgName: string;
  email: string;
} = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Desarrollador GROWS',
  role: 'ADMIN',
  orgId: '22222222-2222-2222-2222-222222222222',
  orgName: 'GROWS Dev Team',
  email: 'dev@grows.app',
};

export type MockUser = typeof mockUser;
