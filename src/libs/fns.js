import { useToast } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import React from 'react';
import { supabase } from '../libs/supabaseClient';
import {
  clipDataAtom,
  dataVersionAtom,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SETTING,
  hasMoreAtom,
  loadingAtom,
  SETTING_KEYS,
  settingAtom,
  userAtom,
} from './states';

const tableNames = {
  setting: 'rushbin-setting',
  data: 'rushbin-data',
  id: 'incremental-id', // for LocalStorage only
};

export const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

/** Keep only the known setting keys — never persist DB columns like `id`/`created_at`,
 *  and never let a missing key wipe out its default. */
export const pickSetting = (setting = {}) =>
  SETTING_KEYS.reduce(
    (acc, key) => (setting[key] === undefined ? acc : { ...acc, [key]: setting[key] }),
    {}
  );

const readLocalStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback; // corrupt value — start fresh instead of crashing
  }
};

const getLocalStorage = (table = tableNames.data) => {
  switch (table) {
    case tableNames.setting:
      return { ...DEFAULT_SETTING, ...pickSetting(readLocalStorage('rushbin-setting', {})) };
    case tableNames.data:
      return readLocalStorage('rushbin-data', []);
    case tableNames.id:
      return readLocalStorage('incremental-id', 0);
    default:
      throw new Error('not implemented in getLocalStorage');
  }
};

/**
 * Fetches one page plus a one-row lookahead so the UI knows whether
 * a next page exists (without ever showing an empty page).
 */
export const getData = async ({ currentPage, pageSize, userId }) => {
  const page = currentPage > 0 ? currentPage : 1;
  const size = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
  const start = (page - 1) * size;

  if (!userId) {
    const slice = getLocalStorage(tableNames.data).slice(start, start + size + 1);
    return { items: slice.slice(0, size), hasMore: slice.length > size };
  }

  const { data, error } = await supabase
    .from('rushbin-data')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(start, start + size); // inclusive end => size + 1 rows

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  return { items: rows.slice(0, size), hasMore: rows.length > size };
};

export const postData = async (val, userId) => {
  const text = (val ?? '').trim();
  if (!text) {
    throw new Error('Nothing to save — the text is empty.');
  }

  if (!userId) {
    const oldData = getLocalStorage(tableNames.data);
    const id = getLocalStorage(tableNames.id);

    const data = [
      { id, val: text, created_at: new Date().toISOString(), user_id: 'localStorage' },
      ...oldData,
    ];

    localStorage.setItem('rushbin-data', JSON.stringify(data));
    localStorage.setItem('incremental-id', JSON.stringify(Number(id) + 1));
  } else {
    const { error } = await supabase.from('rushbin-data').insert({ val: text, user_id: userId });

    if (error) {
      throw new Error(error.message);
    }
  }
};

export const deleteData = async (id, userId) => {
  if (!userId) {
    const oldData = getLocalStorage(tableNames.data);
    localStorage.setItem('rushbin-data', JSON.stringify(oldData.filter((d) => d.id !== id)));
  } else {
    const { error } = await supabase
      .from('rushbin-data')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  }
};

export const patchData = async ({ id, val }, userId) => {
  const text = (val ?? '').trim();
  if (!text) {
    throw new Error('Nothing to save — the text is empty.');
  }

  if (!userId) {
    const oldData = getLocalStorage(tableNames.data);
    const newData = oldData.map((d) => (d.id === id ? { ...d, val: text } : d));
    localStorage.setItem('rushbin-data', JSON.stringify(newData));
  } else {
    const { error } = await supabase
      .from('rushbin-data')
      .update({ val: text })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  }
};

export const getSettingData = async (userId) => {
  if (!userId) {
    return getLocalStorage(tableNames.setting);
  }

  const { data, error } = await supabase
    .from('rushbin-setting')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return DEFAULT_SETTING;
  }
  return { ...DEFAULT_SETTING, ...pickSetting(data) };
};

export const saveSettingData = async (setting, userId) => {
  const row = pickSetting(setting);

  if (!userId) {
    localStorage.setItem('rushbin-setting', JSON.stringify(row));
    return 'local';
  }

  const { data: existing, error: readError } = await supabase
    .from('rushbin-setting')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  const { error } = existing
    ? await supabase.from('rushbin-setting').update(row).eq('user_id', userId)
    : await supabase.from('rushbin-setting').insert({ ...row, user_id: userId });

  if (error) {
    throw new Error(error.message);
  }
  return 'cloud';
};

export const useData = () => {
  // Global refresh trigger — one bump refetches once (see useDataLoader),
  // no matter how many components call useData().
  const [, setDataVersion] = useAtom(dataVersionAtom);
  const updateData = React.useCallback(() => setDataVersion((v) => v + 1), [setDataVersion]);

  const [data, setData] = useAtom(clipDataAtom);
  const [hasMore] = useAtom(hasMoreAtom);
  const [isLoading, setIsLoading] = useAtom(loadingAtom);
  const [setting, setSetting] = useAtom(settingAtom);
  const [user] = useAtom(userAtom);
  const userId = user?.id ?? null;
  const toast = useToast();
  const toastError = (msg) =>
    toast({
      title: 'Error',
      description: msg,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  const toastSuccess = (msg) =>
    toast({ title: msg, status: 'success', duration: 3000, isClosable: true });

  return {
    updateData,
    data,
    setData,
    hasMore,
    isLoading,
    setIsLoading,
    setting,
    setSetting,
    user,
    userId,
    toast,
    toastError,
    toastSuccess,
  };
};

/**
 * The single place that loads clip data. Mount ONCE inside the app
 * (App renders <DataLoader/>); every useData() caller only reads the
 * shared atoms and nudges `dataVersionAtom` via updateData().
 */
export const useDataLoader = () => {
  const [dataVersion] = useAtom(dataVersionAtom);
  const [setting] = useAtom(settingAtom);
  const [user] = useAtom(userAtom);
  const [, setData] = useAtom(clipDataAtom);
  const [, setHasMore] = useAtom(hasMoreAtom);
  const [, setIsLoading] = useAtom(loadingAtom);
  const toast = useToast();

  const { currentPage, pageSize } = setting;
  const userId = user?.id ?? null;

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      if (currentPage < 1 || pageSize < 1) return;

      setIsLoading((d) => ({ ...d, get: true }));
      try {
        const { items, hasMore } = await getData({ currentPage, pageSize, userId });
        if (cancelled) return;
        setData(items);
        setHasMore(hasMore);
      } catch (e) {
        if (cancelled) return;
        toast({
          title: 'Error',
          description: e.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        if (!cancelled) setIsLoading((d) => ({ ...d, get: false }));
      }
    })();

    return () => {
      cancelled = true;
    };
    // setData/setHasMore/setIsLoading are stable jotai setters; toast is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, dataVersion, userId]);
};
