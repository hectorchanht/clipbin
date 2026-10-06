import { useAtom } from 'jotai';
import React from 'react';
import { api, checkBackend } from './apiClient';
import { userAtom } from './states';

/**
 * Syncs the backend session into state on app load.
 * No backend (static mirror) → stays logged out, app runs in local mode.
 * Login/logout (incl. magic-link redemption) refresh via updateData()
 * in the Auth component — no polling needed.
 */
export const useAuthSession = () => {
  const [, setUser] = useAtom(userAtom);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await checkBackend();
      if (!ok) {
        if (!cancelled) setUser(null);
        return;
      }
      try {
        const { user } = await api('/auth/session');
        if (!cancelled) setUser(user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser]);
};

export default useAuthSession;
