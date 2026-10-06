import { MinusIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Icon, Input, InputGroup, InputRightElement } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useData, validateEmail } from '../libs/fns';
import { supabase } from '../libs/supabaseClient';

const AccountIcon = (props) => <Icon viewBox='0 0 24 24' {...props}>
  <path fill='currentColor' d="M3 5v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5a2 2 0 00-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z"></path>
</Icon>;

const SwitchAccountIcon = (props) => <Icon viewBox='0 0 24 24' {...props}>
  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H8v-1.5c0-1.99 4-3 6-3s6 1.01 6 3V16z"></path>
</Icon>;

export default function Auth() {
  const { updateData, isLoading, setIsLoading, setting, setSetting, toast, toastError, user } = useData();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = React.useState(false);

  const withAuthLoading = async (fn) => {
    setIsLoading(d => ({ ...d, auth: true }));
    try {
      await fn();
    } finally {
      setIsLoading(d => ({ ...d, auth: false }));
    }
  };

  const clearEmailPassword = () => {
    setEmail('');
    setPassword('');
  };

  const handleLogin = () => withAuthLoading(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toastError(error.message);
    } else {
      updateData();
    }
  });

  const magicLogin = () => withAuthLoading(async () => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      toastError(error.message);
    } else {
      toast({
        title: 'Go check your email!',
        description: 'Click the magic link to log in.',
        status: 'success',
      });
    }
  });

  const handleSignUp = () => withAuthLoading(async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toastError(error.message);
    } else if (!data.session) {
      toast({
        title: 'Check your email to confirm your account.',
        status: 'success',
      });
      clearEmailPassword();
    } else {
      updateData();
      clearEmailPassword();
    }
  });

  const handleLogout = () => withAuthLoading(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toastError(error.message);
    } else {
      updateData();
      clearEmailPassword();
    }
  });

  const toggleAuthHidden = () => setSetting((d) => ({ ...d, isAuthHidden: !d.isAuthHidden }));

  if (setting?.isAuthHidden) {
    return (
      <Button colorScheme={'blue'} onClick={toggleAuthHidden}>
        {user?.id ? <SwitchAccountIcon /> : <AccountIcon />}
      </Button>
    );
  }

  if (user?.id) {
    return (
      <Flex justifyContent={'space-between'} my={4}>
        <Button bg={'transparent'} onClick={toggleAuthHidden}>
          <MinusIcon />
        </Button>

        <Button
          isLoading={isLoading.auth}
          colorScheme='teal'
          variant='outline'
          onClick={handleLogout}
        >
          Logout {user.email}
        </Button>
      </Flex>
    );
  }

  const emailValid = validateEmail(email);

  return (
    <Box as={'form'} mb={4} onSubmit={(e) => e.preventDefault()}>
      <InputGroup size='md' mb={4}>
        <Input
          autoComplete={'email'}
          type={'email'}
          placeholder='Enter Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {emailValid && <>
          <Input
            autoComplete='current-password'
            type={show ? 'text' : 'password'}
            placeholder='Enter Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputRightElement width='4.5rem'>
            <Button h='1.75rem' size='sm' onClick={() => setShow(!show)}>
              {show ? <ViewOffIcon /> : <ViewIcon />}
            </Button>
          </InputRightElement>
        </>}
      </InputGroup>

      <Flex justifyContent={'space-between'}>
        <Button bg={'transparent'} onClick={toggleAuthHidden}>
          <MinusIcon />
        </Button>
        {!emailValid && (
          <Box fontSize='sm' color='gray.500' alignSelf='center'>
            Enter your email to log in or sign up
          </Box>
        )}

        {emailValid && <>
          <Button
            isLoading={isLoading.auth}
            colorScheme='teal'
            variant='outline'
            onClick={handleSignUp}
            isDisabled={password.length < 6}
          >
            Sign Up
          </Button>
          <Button
            isLoading={isLoading.auth}
            colorScheme='teal'
            variant='outline'
            onClick={magicLogin}
          >
            Magic Login
          </Button>
          <Button
            isLoading={isLoading.auth}
            colorScheme='teal'
            variant='outline'
            onClick={handleLogin}
            isDisabled={password.length < 6}
          >
            Login
          </Button>
        </>}
      </Flex>
    </Box>
  );
}
