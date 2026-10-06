import { CheckIcon, CloseIcon, DeleteIcon } from '@chakra-ui/icons';
import { Box, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from '@chakra-ui/react';
import React from 'react';
import { api } from '../../libs/apiClient';
import { useData } from '../../libs/fns';


const DeleteBtn = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onClose = () => setIsOpen(false);
  const { data, setData, userId, toastError, toastSuccess, setSetting } = useData();

  const handleClearData = async () => {
    try {
      if (userId) {
        await api('/clips', { method: 'DELETE' });
      } else {
        localStorage.setItem('clipbin-data', JSON.stringify([]));
        localStorage.setItem('clipbin-id', JSON.stringify(0));
        localStorage.setItem('clipbin-images', JSON.stringify([]));
        localStorage.setItem('clipbin-images-id', JSON.stringify(0));
      }
      setData([]);
      setSetting((d) => ({ ...d, currentPage: 1 }));
      toastSuccess('All entries deleted');
    } catch (e) {
      toastError(e.message);
    } finally {
      onClose();
    }
  };

  return (
    <Box>
      <Button colorScheme='red' onClick={() => setIsOpen(true)} isDisabled={data.length < 1} aria-label='Delete all entries'>
        <DeleteIcon />
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reset Data</ModalHeader>
          <ModalBody>
            <Text>
              Are you sure to delete all data {userId ? 'online' : 'locally'}?
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose}>
              <CloseIcon />
            </Button>
            <Button colorScheme='red' ml={3} onClick={handleClearData}>
              <CheckIcon />
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DeleteBtn;
