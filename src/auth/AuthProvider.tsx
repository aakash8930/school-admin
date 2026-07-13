import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthTokens, JwtClaims } from '../lib/types';
import { apiPost, http, refreshSession, setOnAuthLost } from '../lib/api';
import { decodeClaims, tokenStore } from '../lib/tokenStore';
import { AuthContext, type AuthContextValue } from './AuthContext';

/** The signed-in user, if the stored access token is still good. An expired one
 *  isn't a logout — the refresh token outlives it and `restore` trades it in. */
function currentUser(): JwtClaims | null {
  const token = tokenStore.access;
  if (!token) return null;
  const claims = decodeClaims(token);
  if (claims && claims.exp * 1000 < Date.now()) return null;
  return claims;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtClaims | null>(() => currentUser());
  // A stale access token plus a refresh token means we can restore the session,
  // but not synchronously — hold the app on a splash until we know.
  const [isRestoring, setIsRestoring] = useState(
    () => currentUser() === null && tokenStore.refresh !== null,
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (tokenStore.access) {
        // Name the device so the backend ends only this session, not the
        // user's other signed-in devices.
        await http.post('/auth/logout', { refreshToken: tokenStore.refresh });
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

  // Restore the session on load: the access token expires every 15 minutes, so
  // after any idle spell it's the refresh token that carries the session back.
  useEffect(() => {
    if (!isRestoring) return;
    let cancelled = false;
    void refreshSession()
      .then((tokens) => {
        if (!cancelled) setUser(decodeClaims(tokens.accessToken));
      })
      .catch(() => {
        // Refresh token revoked, expired, or gone — a real logout.
        tokenStore.clear();
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isRestoring]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isRestoring,
      login,
      logout,
    }),
    [user, isRestoring, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
