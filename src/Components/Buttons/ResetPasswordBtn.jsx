import { CheckIcon, CloseIcon, ViewIcon, ViewOffIcon, WarningTwoIcon } from '@chakra-ui/icons';
import { Box, Button, Input, InputGroup, InputRightElement, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import React from 'react';
import { useData, validateEmail } from '../../libs/fns';
import { supabase } from '../../libs/supabaseClient';


const ResetPasswordBtn = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const onClose = () => setIsOpen(false);
  const [newPassword, setNewPassword] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const { toastError, toastSuccess, user } = useData();

  const email = user?.email;
  if (!email) return null;

  const handleResetPassword = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      toastSuccess('Password updated');
      setNewPassword('');
      onClose();
    } catch (e) {
      toastError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Button colorScheme='yellow' onClick={() => setIsOpen(true)} aria-label='Reset password'>
        <WarningTwoIcon />
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reset Password</ModalHeader>
          <ModalBody>
            <Box as={'form'} mb={4} onSubmit={(e) => e.preventDefault()}>
              <InputGroup size='md' mb={4}>
                <Input
                  autoComplete={'email'}
                  type={'email'}
                  placeholder='Enter Email'
                  value={email}
                  readOnly
                />

                {validateEmail(email) && <>
                  <Input
                    autoComplete='new-password'
                    type={show ? 'text' : 'password'}
                    placeholder='Enter new Password'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <InputRightElement width='4.5rem'>
                    <Button h='1.75rem' size='sm' onClick={() => setShow(!show)}>
                      {show ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </>}
              </InputGroup>
            </Box>

          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>
              <CloseIcon />
            </Button>
            <Button
              colorScheme='red'
              ml={3}
              onClick={handleResetPassword}
              isLoading={saving}
              isDisabled={newPassword.length < 6}
            >
              <CheckIcon />
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResetPasswordBtn;
