import { atom } from 'jotai';


export const DEFAULT_PAGE_SIZE = 10;

export const DEFAULT_SETTING = {
  isAuthHidden: false,
  isSettingHidden: false,
  currentPage: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  isEditing: false,
};

/** Keys that are persisted to localStorage / Supabase. Anything else (e.g. DB `id`) is stripped on save. */
export const SETTING_KEYS = Object.keys(DEFAULT_SETTING);

export const settingAtom = atom(DEFAULT_SETTING);

export const loadingAtom = atom({
  get: false,
  post: false,
  delete: false,
  auth: false
});

export const clipDataAtom = atom([]);

/** Lookahead flag: is there at least one more page after the current one? */
export const hasMoreAtom = atom(false);

/** Supabase user object, or null when logged out / offline. Kept in sync by useAuthSession. */
export const userAtom = atom(null);

/** Bumped to trigger a single global data refetch (see useDataLoader). */
export const dataVersionAtom = atom(0);
