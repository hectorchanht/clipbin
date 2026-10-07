import { Flex, IconButton, Text, Textarea } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { ClipboardPaste } from 'lucide-react';
import React from 'react';
import { postData, useData } from '../libs/fns';
import { postImage } from '../libs/imageStore';
import { imageVersionAtom } from '../libs/states';

/** Textarea stops growing past this and scrolls instead. */
const MAX_GROW_PX = 200;

/**
 * The single compose row: a 1-line textarea that grows as you type
 * (auto-saves when you tap away), plus an icon button that saves
 * whatever is on the OS clipboard (text or images).
 */
const ComposeRow = () => {
  const { updateData, isLoading, setIsLoading, setSetting, toastError, toastSuccess, userId } = useData();
  const [, setImageVersion] = useAtom(imageVersionAtom);
  const [text, setText] = React.useState('');
  // idle | saving | saved | error
  const [status, setStatus] = React.useState('idle');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [savedAt, setSavedAt] = React.useState(null);
  const taRef = React.useRef(null);

  // Grow from 1 line with the content; cap and scroll past the max.
  React.useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_GROW_PX)}px`;
  }, [text]);

  // Mutable bits live in a ref so blur/unmount handlers never go stale.
  const stateRef = React.useRef({ text: '', saving: false });
  stateRef.current.text = text;
  const userIdRef = React.useRef(userId);
  userIdRef.current = userId;

  const doSave = React.useCallback(async () => {
    const st = stateRef.current;
    const val = st.text;
    if (!val.trim() || st.saving) return;
    st.saving = true;
    setStatus('saving');
    try {
      await postData(val, userIdRef.current);
      // Only clear when the user hasn't typed something new mid-save.
      if (stateRef.current.text === val) setText('');
      // New entries land on page 1 — take the user there to see them.
      setSetting((d) => ({ ...d, currentPage: 1 }));
      updateData();
      setSavedAt(new Date());
      setStatus('saved');
    } catch (e) {
      setErrorMsg(e.message);
      setStatus('error');
      toastError(e.message);
    } finally {
      stateRef.current.saving = false;
    }
  }, [setSetting, updateData, toastError]);
  const saveRef = React.useRef(doSave);
  saveRef.current = doSave;

  // Flush any unsaved draft when the tab goes hidden (mobile app switch)
  // or the component unmounts — best effort, nothing may be lost.
  React.useEffect(() => {
    const flush = () => {
      const st = stateRef.current;
      const val = st.text;
      if (val.trim() && !st.saving) {
        st.saving = true;
        st.text = '';
        postData(val, userIdRef.current).catch(() => {});
      }
    };
    const onVis = () => { if (document.hidden) flush(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setText(e.target.value);
    if (status === 'saved' || status === 'error') {
      setStatus('idle');
      setErrorMsg('');
    }
  };

  const saveClipboardImages = async () => {
    if (!navigator.clipboard.read) {
      throw new Error('Nothing to save — the clipboard is empty.');
    }
    const items = await navigator.clipboard.read();
    const blobs = [];
    for (const item of items) {
      const imageTypes = item.types.filter((t) => t.startsWith('image/'));
      for (const type of imageTypes) {
        // eslint-disable-next-line no-await-in-loop
        blobs.push(await item.getType(type));
      }
    }
    if (blobs.length === 0) {
      throw new Error('Nothing to save — the clipboard is empty.');
    }
    for (const blob of blobs) {
      const ext = (blob.type.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '') || 'png';
      // eslint-disable-next-line no-await-in-loop
      await postImage(new File([blob], `clipboard.${ext}`, { type: blob.type }), userId);
    }
    setImageVersion((v) => v + 1);
    toastSuccess(
      userId
        ? `Saved ${blobs.length} image${blobs.length > 1 ? 's' : ''} to cloud`
        : `Saved ${blobs.length} image${blobs.length > 1 ? 's' : ''} locally`
    );
  };

  const handleSaveClipboard = async () => {
    setIsLoading((d) => ({ ...d, post: true }));
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText.trim()) {
        await postData(clipText, userId);
        // New entries land on page 1 — take the user there to see them.
        setSetting((d) => ({ ...d, currentPage: 1 }));
        updateData();
        toastSuccess(userId ? 'Saved to cloud' : 'Saved locally');
      } else {
        // No text on the clipboard — it may hold an image instead.
        await saveClipboardImages();
      }
    } catch (e) {
      toastError(e.message || 'Clipboard read permission denied. Enable it under the site information of your browser.');
    } finally {
      setIsLoading((d) => ({ ...d, post: false }));
    }
  };

  const statusColor = status === 'error' ? 'red.400' : 'gray.500';
  const statusText =
    status === 'saving' ? 'Saving…' :
    status === 'saved' && savedAt ? `Saved ✓ ${savedAt.toLocaleTimeString()}` :
    status === 'error' ? errorMsg :
    '';

  return (
    <React.Fragment>
      <Flex gap={2} align='flex-end'>
        <Textarea
          ref={taRef}
          size='sm'
          value={text}
          onChange={handleChange}
          onBlur={() => saveRef.current()}
          placeholder='Type anything to save…'
          rows={1}
          resize='none'
          overflowY='auto'
        />
        <IconButton
          size='sm'
          aria-label='Save clipboard'
          title='Save clipboard contents'
          icon={<ClipboardPaste size={16} />}
          colorScheme='teal'
          onClick={handleSaveClipboard}
          isLoading={isLoading.post}
          flexShrink={0}
        />
      </Flex>

      {status !== 'idle' && (
        <Flex justify='flex-end' mt={1}>
          <Text fontSize='xs' color={statusColor}>
            {statusText}
          </Text>
        </Flex>
      )}
    </React.Fragment>
  );
};

export default ComposeRow;
