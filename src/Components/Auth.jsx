import { Box, IconButton, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Text } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import { MailCheck, Send } from 'lucide-react';
import React from 'react';
import { api, checkBackend } from '../libs/apiClient';
import { useData, validateEmail } from '../libs/fns';
import { authModalOpenAtom, userAtom } from '../libs/states';

/**
 * Redeems a magic-link token from the URL (?magic=token). Runs once on
 * mount; the link itself does nothing until the app POSTs the token, so
 * mail-scanner prefetching can't burn the single-use token.
 */
export function useMagicRedeem() {
  const { updateData, setIsLoading, toast, toastError } = useData();
  const [, setUser] = useAtom(userAtom);

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
}

/**
 * Passwordless sign-in, opened from the header ⋯ menu: the user enters
 * an email, we send a magic link, they click it (in any browser) and
 * come back logged in. No backend (static mirror) → the menu hides
 * the sign-in entry, so this modal never opens there.
 */
function AuthModal() {
  const [open, setOpen] = useAtom(authModalOpenAtom);
  const { isLoading, setIsLoading, toastError } = useData();
  const [email, setEmail] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [linkSentTo, setLinkSentTo] = React.useState(null);
  const [backend, setBackend] = React.useState(null);

  React.useEffect(() => {
    if (open) checkBackend().then(setBackend);
  }, [open ]);

  const close = () => {
    setOpen(false);
    setEmail('');
    setLinkSentTo(null);
  };

  const sendMagicLink = async () => {
    const addr = email.trim();
    if (!validateEmail(addr)) return;
    setSending(true);
    setIsLoading((d) => ({ ...d, auth: true }));
    try {
      await api('/auth/magic-link', { method: 'POST', body: { email: addr } });
      setLinkSentTo(addr);
      setEmail('');
    } catch (e) {
      toastError(e.message);
    } finally {
      setSending(false);
      setIsLoading((d) => ({ ...d, auth: false }));
    }
  };

  const emailValid = validateEmail(email.trim());

  return (
    <Modal isOpen={open} onClose={close} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Sign in</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {backend === false ? (
            <Text fontSize='sm' color='gray.500'>
              Sign-in needs the Clipbin backend — this copy is running in local-only mode.
            </Text>
          ) : linkSentTo ? (
            <Box textAlign='center' py={2}>
              <MailCheck size={32} style={{ margin: '0 auto 8px' }} />
              <Text>
                We sent a sign-in link to <b>{linkSentTo}</b>.
              </Text>
              <Text fontSize='sm' color='gray.500' mt={1}>
                Click it within 15 minutes to log in.
              </Text>
            </Box>
          ) : (
            <Box
              as='form'
              display='flex'
              gap={2}
              onSubmit={(e) => { e.preventDefault(); if (emailValid) sendMagicLink(); }}
            >
              <Input
                autoFocus
                autoComplete='email'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <IconButton
                type='submit'
                aria-label='Send magic link'
                title='Send magic link'
                icon={<Send size={18} />}
                colorScheme='teal'
                isLoading={sending || isLoading.auth}
                isDisabled={!emailValid}
                flexShrink={0}
              />
            </Box>
          )}
          {!linkSentTo && backend !== false && (
            <Text fontSize='xs' color='gray.500' mt={2}>
              Passwordless login — we email you a sign-in link.
            </Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

/** Invisible glue: magic-link redemption + the sign-in modal. */
export default function Auth() {
  useMagicRedeem();
  return <AuthModal />;
}
