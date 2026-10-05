import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { supabase } from './supabaseClient';
import { userAtom } from './states';

/**
 * Keeps `userAtom` in sync with the Supabase session.
 * Mount once (in App). onAuthStateChange fires immediately with the
 * initial session, so OAuth redirects resolve without any polling hack.
 */
export const useAuthSession = () => {
  const [, setUser] = useAtom(userAtom);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) setUser(session?.user ?? null);
      })
      .catch(() => {
        // e.g. placeholder URL in local-only mode — stay logged out
        if (!cancelled) setUser(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setUser]);
};
