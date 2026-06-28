import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthTokens, JwtClaims } from '../lib/types';
import { apiPost, http, setOnAuthLost } from '../lib/api';
import { decodeClaims, tokenStore } from '../lib/tokenStore';
import { AuthContext, type AuthContextValue } from './AuthContext';

function currentUser(): JwtClaims | null {
  const token = tokenStore.access;
  if (!token) return null;
  const claims = decodeClaims(token);
  // Treat expired access tokens as logged-out on first paint.
  if (claims && claims.exp * 1000 < Date.now()) return null;
  return claims;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtClaims | null>(() => currentUser());

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (tokenStore.access) {
        await http.post('/auth/logout');
      }
    } catch {
      // Ignore network/logout errors — clear locally regardless.
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const tokens = await apiPost<AuthTokens>('/auth/login', {
        email,
        password,
      });
      tokenStore.set(tokens);
      setUser(decodeClaims(tokens.accessToken));
    },
    [],
  );

  // When the API layer detects auth is unrecoverable, drop the session.
  useEffect(() => {
    setOnAuthLost(() => {
      tokenStore.clear();
      setUser(null);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
