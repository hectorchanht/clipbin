import { Button, Textarea } from '@chakra-ui/react';
import React from 'react';
import useClipboard from '../libs/useClipboard';
import { postData, useData } from '../libs/fns';

const PostFromClipboard = ({ showInput = true }) => {
  const [clipboard] = useClipboard({ updateFrequency: 64 });
  const { updateData, isLoading, setIsLoading, setSetting, toastError, toastSuccess, userId } = useData();

  const handleSave = async () => {
    setIsLoading((d) => ({ ...d, post: true }));
    try {
      const text = await navigator.clipboard.readText();
      await postData(text, userId);
      // New entries land on page 1 — take the user there to see them.
      setSetting((d) => ({ ...d, currentPage: 1 }));
      updateData();
      toastSuccess(userId ? 'Saved to cloud' : 'Saved locally');
    } catch (e) {
      toastError(e.message || 'Clipboard read permission denied. Enable it under the site information of your browser.');
    } finally {
      setIsLoading((d) => ({ ...d, post: false }));
    }
  };

  return (
    <React.Fragment>
      {showInput && <Textarea value={clipboard} isReadOnly placeholder='Your current clipboard contents…' />}

      <Button
        isFullWidth
        onClick={handleSave}
        isLoading={isLoading.post}
        colorScheme='teal'
        variant='solid'
      >
        Save Clipboard
      </Button>
    </React.Fragment>
  );
};

export default PostFromClipboard;
