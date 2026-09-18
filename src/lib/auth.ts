import { createAuthClient } from '@neondatabase/neon-js/auth';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-weathered-firefly-ac4vrg3x.neonauth.sa-east-1.aws.neon.tech/neondb/auth';

export const authClient = createAuthClient(authUrl);

export interface AuthUser {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  token?: string;
  expiresAt?: string | Date;
}
