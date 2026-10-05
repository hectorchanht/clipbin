import { Button, Textarea } from '@chakra-ui/react';
import React from 'react';
import { postData, useData } from '../libs/fns';

const PostFromText = ({ showInput = true }) => {
  const { updateData, isLoading, setIsLoading, setSetting, toastError, toastSuccess, userId } = useData();
  const [text, setText] = React.useState('');

  const handleSave = async () => {
    setIsLoading((d) => ({ ...d, post: true }));
    try {
      await postData(text, userId);
      // New entries land on page 1 — take the user there to see them.
      setSetting((d) => ({ ...d, currentPage: 1 }));
      updateData();
      setText('');
      toastSuccess(userId ? 'Saved to cloud' : 'Saved locally');
    } catch (e) {
      toastError(e.message);
    } finally {
      setIsLoading((d) => ({ ...d, post: false }));
    }
  };

  return (
    <React.Fragment>
      {showInput && (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Type or paste text here…'
        />
      )}

      <Button
        isFullWidth
        isDisabled={!text.trim()}
        onClick={handleSave}
        isLoading={isLoading.post}
        colorScheme='teal'
        variant='solid'
      >
        Save Text
      </Button>
    </React.Fragment>
  );
};

export default PostFromText;
