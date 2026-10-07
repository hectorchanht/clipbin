import { Flex, Text, Textarea } from '@chakra-ui/react';
import React from 'react';
import { postData, useData } from '../libs/fns';

/**
 * The note field auto-saves when the user is DONE with it (blur),
 * never on a timer — so typing is never cut off mid-thought.
 * A hidden-tab / unmount flush catches drafts that never blurred.
 */
const PostFromText = ({ showInput = true }) => {
  const { updateData, setSetting, toastError, userId } = useData();
  const [text, setText] = React.useState('');
  // idle | saving | saved | error
  const [status, setStatus] = React.useState('idle');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [savedAt, setSavedAt] = React.useState(null);

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

  const statusColor = status === 'error' ? 'red.400' : 'gray.500';
  const statusText =
    status === 'saving' ? 'Saving…' :
    status === 'saved' && savedAt ? `Saved ✓ ${savedAt.toLocaleTimeString()}` :
    status === 'error' ? errorMsg :
    'Type anything — saves when you tap away';

  return (
    <React.Fragment>
      {showInput && (
        <Textarea
          value={text}
          onChange={handleChange}
          onBlur={() => saveRef.current()}
          placeholder='Type anything to save…'
        />
      )}

      <Flex justify='flex-end' align='center' mt={1} minH='20px'>
        <Text fontSize='xs' color={statusColor}>
          {statusText}
        </Text>
      </Flex>
    </React.Fragment>
  );
};

export default PostFromText;
