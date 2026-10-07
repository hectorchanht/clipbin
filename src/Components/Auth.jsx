import { MinusIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Icon, Input, Text } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import React from 'react';
import { api, checkBackend } from '../libs/apiClient';
import { useData, validateEmail } from '../libs/fns';
import { userAtom } from '../libs/states';

const AccountIcon = (props) => <Icon viewBox='0 0 24 24' {...props}>
  <path fill='currentColor' d="M3 5v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5a2 2 0 00-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z"></path>
</Icon>;

const SwitchAccountIcon = (props) => <Icon viewBox='0 0 24 24' {...props}>
  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H8v-1.5c0-1.99 4-3 6-3s6 1.01 6 3V16z"></path>
</Icon>;

/**
 * Passwordless auth: the user enters an email, we send a magic link,
 * they click it (in any browser) and come back logged in.
 * No backend (static mirror) → local-only mode, auth UI stays hidden.
 */
export default function Auth() {
  const { updateData, isLoading, setIsLoading, setting, setSetting, toast, toastError, user } = useData();
  const [, setUser] = useAtom(userAtom);
  const [email, setEmail] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [backend, setBackend] = React.useState(null);

  React.useEffect(() => {
    checkBackend().then(setBackend);
  }, []);

  // Coming back from a magic link (?magic=token): redeem it.
  // The link itself does nothing until the app POSTs the token, so
  // mail-scanner prefetching can't burn the single-use token.
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('magic');
    if (!token) return;
    url.searchParams.delete('magic');
    window.history.replaceState({}, '', url.pathname + url.search);

    (async () => {
      setIsLoading((d) => ({ ...d, auth: true }));
      try {
        const { user: u } = await api('/auth/verify', { method: 'POST', body: { token } });
        setUser(u);
        updateData();
        toast({ title: 'Logged in!', description: `Welcome, ${u.email}.`, status: 'success' });
      } catch (e) {
        toastError(e.message || 'This login link is invalid or expired.');
      } finally {
        setIsLoading((d) => ({ ...d, auth: false }));
      }
    })();
    // Runs once on mount; toast/toastError/setUser are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMagicLink = async () => {
    setSending(true);
    setIsLoading((d) => ({ ...d, auth: true }));
    try {
      await api('/auth/magic-link', { method: 'POST', body: { email: email.trim() } });
      toast({
        title: 'Check your email!',
        description: 'Click the magic link to log in (expires in 15 minutes).',
        status: 'success',
      });
      setEmail('');
    } catch (e) {
      toastError(e.message);
    } finally {
      setSending(false);
      setIsLoading((d) => ({ ...d, auth: false }));
    }
  };

  const handleLogout = async () => {
    setIsLoading((d) => ({ ...d, auth: true }));
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (e) {
      toastError(e.message);
    } finally {
      setUser(null);
      updateData();
      setIsLoading((d) => ({ ...d, auth: false }));
    }
  };

  const toggleAuthHidden = () => setSetting((d) => ({ ...d, isAuthHidden: !d.isAuthHidden }));

  // No backend → local-only mode: nothing to log into.
  if (backend === false) {
    return null;
  }

  if (setting?.isAuthHidden) {
    return (
      <Button
        variant='ghost'
        colorScheme='blue'
        onClick={toggleAuthHidden}
        aria-label='Show login'
        title='Show login'
      >
        {user?.id ? <SwitchAccountIcon /> : <AccountIcon />}
      </Button>
    );
  }

  if (user?.id) {
    return (
      <Flex justifyContent={'space-between'} my={4}>
        <Button variant='ghost' onClick={toggleAuthHidden} aria-label='Hide login' title='Hide login'>
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
    <Box as={'form'} mb={4} onSubmit={(e) => { e.preventDefault(); if (emailValid) sendMagicLink(); }}>
      <Input
        autoComplete={'email'}
        type={'email'}
        placeholder='Enter Email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        mb={3}
      />
      <Flex justifyContent={'space-between'} alignItems={'center'}>
        <Button variant='ghost' onClick={toggleAuthHidden} aria-label='Hide login' title='Hide login'>
          <MinusIcon />
        </Button>
        <Button
          isLoading={sending || isLoading.auth}
          colorScheme='teal'
          variant='outline'
          onClick={sendMagicLink}
          isDisabled={!emailValid}
        >
          Send magic link
        </Button>
      </Flex>
      <Text fontSize='xs' color='gray.500' mt={2}>
        Passwordless login — we email you a sign-in link.
      </Text>
    </Box>
  );
}
