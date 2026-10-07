import { Flex, Text, Textarea } from '@chakra-ui/react';
import React from 'react';
import { postData, useData } from '../libs/fns';

// Idle time after the last keystroke before the note is auto-saved.
const AUTOSAVE_DELAY = 1200;

const PostFromText = ({ showInput = true }) => {
  const { updateData, setSetting, toastError, userId } = useData();
  const [text, setText] = React.useState('');
  // idle | typing | saving | saved | error
  const [status, setStatus] = React.useState('idle');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [savedAt, setSavedAt] = React.useState(null);

  // Mutable bits live in a ref so timers never capture stale state.
  const stateRef = React.useRef({ text: '', saving: false, timer: null });
  stateRef.current.text = text;
  const userIdRef = React.useRef(userId);
  userIdRef.current = userId;

  const scheduleSave = () => {
    const st = stateRef.current;
    if (st.timer) clearTimeout(st.timer);
    st.timer = setTimeout(() => {
      st.timer = null;
      void saveRef.current();
    }, AUTOSAVE_DELAY);
  };

  const doSave = async () => {
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
      // Text changed while saving → schedule another pass for the rest.
      if (stateRef.current.text.trim()) scheduleSave();
    }
  };
  const saveRef = React.useRef(doSave);
  saveRef.current = doSave;

  // Flush any pending save on unmount — best effort, nothing may be lost.
  React.useEffect(() => () => {
    const st = stateRef.current;
    if (st.timer) {
      clearTimeout(st.timer);
      st.timer = null;
    }
    if (st.text.trim() && !st.saving) {
      postData(st.text, userIdRef.current).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setText(e.target.value);
    setStatus('typing');
    setErrorMsg('');
    scheduleSave();
  };

  const statusColor = status === 'error' ? 'red.400' : 'gray.500';
  const statusText =
    status === 'typing' ? '…' :
    status === 'saving' ? 'Saving…' :
    status === 'saved' && savedAt ? `Saved ✓ ${savedAt.toLocaleTimeString()}` :
    status === 'error' ? errorMsg : '';

  return (
    <React.Fragment>
      {showInput && (
        <Textarea
          value={text}
          onChange={handleChange}
          placeholder='Type or paste text here…'
        />
      )}

      <Flex justify='space-between' align='center' mt={1} minH='20px'>
        <Text fontSize='xs' color='gray.500'>
          New note — saves automatically
        </Text>
        <Text fontSize='xs' color={statusColor}>
          {statusText}
        </Text>
      </Flex>
    </React.Fragment>
  );
};

export default PostFromText;
