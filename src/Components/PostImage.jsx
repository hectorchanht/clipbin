import { Flex, IconButton, Input, Spacer, Text } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { ImagePlus } from 'lucide-react';
import React from 'react';
import { useData } from '../libs/fns';
import { postImage } from '../libs/imageStore';
import { imageVersionAtom } from '../libs/states';

/**
 * Image capture, compact: one row — "Images" label plus a single
 * upload icon button (this is all mobile shows). Paste works anywhere
 * in the app; the row doubles as a drop target and highlights while
 * dragging.
 */
const PostImage = () => {
  const { userId, toastError, toastSuccess, setIsLoading } = useData();
  const [, setImageVersion] = useAtom(imageVersionAtom);
  const inputRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const refreshImages = React.useCallback(() => {
    setImageVersion((v) => v + 1);
  }, [setImageVersion]);

  const saveFiles = React.useCallback(
    async (fileList) => {
      const imgs = [...(fileList ?? [])].filter(
        (f) => f && typeof f.type === 'string' && f.type.startsWith('image/')
      );
      if (imgs.length === 0 || busy) {
        return;
      }
      setBusy(true);
      setIsLoading((d) => ({ ...d, post: true }));
      try {
        for (const f of imgs) {
          // eslint-disable-next-line no-await-in-loop
          await postImage(f, userId);
        }
        toastSuccess(
          userId
            ? `Saved ${imgs.length} image${imgs.length > 1 ? 's' : ''} to cloud`
            : `Saved ${imgs.length} image${imgs.length > 1 ? 's' : ''} locally`
        );
        refreshImages();
      } catch (e) {
        toastError(e.message);
      } finally {
        setBusy(false);
        setIsLoading((d) => ({ ...d, post: false }));
      }
    },
    [busy, refreshImages, setIsLoading, toastError, toastSuccess, userId]
  );

  // Pasting an image anywhere saves it (text pastes carry no files,
  // so the text inputs are unaffected).
  React.useEffect(() => {
    const onPaste = (e) => {
      const files = [...(e.clipboardData?.files ?? [])].filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) {
        e.preventDefault();
        saveFiles(files);
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [saveFiles]);

  return (
    <Flex
      align='center'
      border='2px dashed'
      borderColor={dragging ? 'teal.300' : 'transparent'}
      borderRadius='md'
      px={1}
      py={0}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        saveFiles(e.dataTransfer?.files);
      }}
    >
      <Text fontWeight='semibold' fontSize='sm' title='Paste, drop, or upload images'>
        Images
      </Text>
      <Spacer />
      <IconButton
        size='sm'
        aria-label='Upload images'
        title='Upload images — you can also paste or drop them anywhere'
        icon={<ImagePlus size={16} />}
        variant='holdr'
        isLoading={busy}
        onClick={() => inputRef.current?.click()}
      />
      <Input
        ref={inputRef}
        type='file'
        accept='image/*'
        multiple
        hidden
        onChange={(e) => {
          saveFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </Flex>
  );
};

export default PostImage;
