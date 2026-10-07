import { Button, Textarea } from '@chakra-ui/react';
import { ClipboardPaste } from 'lucide-react';
import { useAtom } from 'jotai';
import React from 'react';
import useClipboard from '../libs/useClipboard';
import { postData, useData } from '../libs/fns';
import { postImage } from '../libs/imageStore';
import { imageVersionAtom } from '../libs/states';

const PostFromClipboard = ({ showInput = true }) => {
  const [clipboard] = useClipboard({ updateFrequency: 64 });
  const { updateData, isLoading, setIsLoading, setSetting, toastError, toastSuccess, userId } = useData();
  const [, setImageVersion] = useAtom(imageVersionAtom);

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

  const handleSave = async () => {
    setIsLoading((d) => ({ ...d, post: true }));
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        await postData(text, userId);
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

  return (
    <React.Fragment>
      {showInput && <Textarea value={clipboard} isReadOnly placeholder='Your current clipboard contents…' />}

      <Button
        isFullWidth
        onClick={handleSave}
        isLoading={isLoading.post}
        colorScheme='teal'
        variant='solid'
        leftIcon={<ClipboardPaste size={18} />}
      >
        Save Clipboard
      </Button>
    </React.Fragment>
  );
};

export default PostFromClipboard;
