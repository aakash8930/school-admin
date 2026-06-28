import { createContext } from 'react';
import type { JwtClaims } from '../lib/types';

export interface AuthContextValue {
  user: JwtClaims | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
