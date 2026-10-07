import { ArrowLeft, ArrowRight, Copy, Download, Trash2 } from 'lucide-react';
import {
  Button,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Skeleton,
  Text,
} from '@chakra-ui/react';
import { useAtom } from 'jotai';
import React from 'react';
import { useData } from '../libs/fns';
import { copyImageToClipboard, deleteImage } from '../libs/imageStore';
import { imageVersionAtom } from '../libs/states';

const formatDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
};

const extOf = (mime) => (mime || 'image/png').split('/')[1] || 'png';

const ImageList = ({ items, loading, page, hasMore, onPrev, onNext }) => {
  const { userId, toastError, toastSuccess, setIsLoading } = useData();
  const [, setImageVersion] = useAtom(imageVersionAtom);
  const [active, setActive] = React.useState(null);
  const [working, setWorking] = React.useState(false);

  const refresh = React.useCallback(() => setImageVersion((v) => v + 1), [setImageVersion]);

  const handleDelete = async (rec) => {
    setWorking(true);
    setIsLoading((d) => ({ ...d, delete: true }));
    try {
      await deleteImage(rec, userId);
      setActive(null);
      toastSuccess('Image deleted');
      refresh();
    } catch (e) {
      toastError(e.message);
    } finally {
      setWorking(false);
      setIsLoading((d) => ({ ...d, delete: false }));
    }
  };

  const handleCopy = async (rec) => {
    try {
      await copyImageToClipboard(rec.url, rec.mime);
      toastSuccess('Image copied to clipboard');
    } catch (e) {
      toastError(e.message);
    }
  };

  const handleDownload = async (rec) => {
    try {
      const res = await fetch(rec.url);
      if (!res.ok) {
        throw new Error('Could not fetch the image.');
      }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `clipbin-${rec.id}.${extOf(rec.mime)}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (e) {
      toastError(e.message);
    }
  };

  if (loading) {
    return (
      <Grid templateColumns='repeat(3, 1fr)' gap={3} mt={4}>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} height='120px' borderRadius='md' />
        ))}
      </Grid>
    );
  }

  if (items.length === 0) {
    return (
      <Text color='gray.500' mt={4} fontSize='sm'>
        No images yet — paste or upload one above.
      </Text>
    );
  }

  return (
    <React.Fragment>
      <Grid templateColumns='repeat(3, 1fr)' gap={3} mt={4}>
        {items.map((r) => (
          <GridItem key={r.id}>
            <Image
              src={r.url}
              alt=''
              borderRadius='md'
              objectFit='cover'
              h='120px'
              w='100%'
              cursor='pointer'
              loading='lazy'
              onClick={() => setActive(r)}
            />
          </GridItem>
        ))}
      </Grid>

      <Flex justify='space-between' align='center' mt={3}>
        <IconButton
          size='sm'
          variant='outline'
          aria-label='Previous page'
          title='Previous page'
          icon={<ArrowLeft size={16} />}
          onClick={onPrev}
          isDisabled={page <= 1}
        />
        <Text fontSize='sm' color='gray.500'>
          Page {page}
        </Text>
        <IconButton
          size='sm'
          variant='outline'
          aria-label='Next page'
          title='Next page'
          icon={<ArrowRight size={16} />}
          onClick={onNext}
          isDisabled={!hasMore}
        />
      </Flex>

      <Modal isOpen={!!active} onClose={() => setActive(null)} size='xl' isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={4}>
            {active && <Image src={active.url} alt='' maxH='70vh' mx='auto' borderRadius='md' />}
            <Flex gap={2} mt={4} justify='center' wrap='wrap'>
              <Button
                size='sm'
                leftIcon={<Copy size={16} />}
                onClick={() => handleCopy(active)}
                isDisabled={working}
              >
                Copy
              </Button>
              <Button
                size='sm'
                leftIcon={<Download size={16} />}
                onClick={() => handleDownload(active)}
                isDisabled={working}
              >
                Download
              </Button>
              <Button
                size='sm'
                colorScheme='red'
                variant='outline'
                leftIcon={<Trash2 size={16} />}
                onClick={() => handleDelete(active)}
                isLoading={working}
              >
                Delete
              </Button>
            </Flex>
            <Text fontSize='xs' color='gray.500' mt={2} textAlign='center'>
              {active?.mime}
              {active?.width ? ` · ${active.width}×${active.height}` : ''}
              {' · '}
              {formatDate(active?.created_at)}
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </React.Fragment>
  );
};

export default ImageList;
