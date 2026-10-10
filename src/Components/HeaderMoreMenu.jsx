import {
  Button,
  Flex,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  Text,
} from '@chakra-ui/react';
import { BadgeCheck, Check, Coffee, Copy, Ellipsis, LogIn, LogOut, Pencil, Trash2 } from 'lucide-react';
import { useAtom } from 'jotai';
import React from 'react';
import { api, checkBackend } from '../libs/apiClient';
import { useData } from '../libs/fns';
import { getStoredTipKey, isSponsoredHidden, isSupporter, setSponsoredHidden, setStoredTipKey, setSupporter } from '../libs/sponsored';
import { authModalOpenAtom, userAtom } from '../libs/states';

// Lucide dropped brand icons — keep the GitHub mark as a tiny inline SVG.
const GithubIcon = (props) => (
  <Icon viewBox='0 0 24 24' {...props}>
    <path
      fill='currentColor'
      d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'
    />
  </Icon>
);

/**
 * The "⋯" menu in the header. Hosts sign in/out (magic link lives here
 * now, not in the main column), edit mode, delete-all, the supporter
 * section (tip-jar key verification + sponsored-strip toggle), and the
 * GitHub source link — keeping the main column clean.
 */
const HeaderMoreMenu = () => {
  const { data, setData, setting, setSetting, setIsLoading, user, userId, toastError, toastSuccess, updateData } = useData();
  const [, setUser] = useAtom(userAtom);
  const [, setAuthOpen] = useAtom(authModalOpenAtom);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [backend, setBackend] = React.useState(null);

  // Supporter section modal state.
  const [sponsoredOpen, setSponsoredOpen] = React.useState(false);
  const [licenseKey, setLicenseKey] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);
  const [hideStrip, setHideStrip] = React.useState(false);

  React.useEffect(() => {
    checkBackend().then(setBackend);
  }, []);

  const toggleEdit = () => setSetting((d) => ({ ...d, isEditing: !d.isEditing }));

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
      setConfirmOpen(false);
    }
  };

  const openSponsoredModal = () => {
    setIsVerified(isSupporter());
    setHideStrip(isSponsoredHidden());
    setLicenseKey(getStoredTipKey()); // pre-fill the stored key, if any
    setVerifyError('');
    setCopied(false);
    setSponsoredOpen(true);
  };

  const handleVerifyTip = async () => {
    const key = licenseKey.trim();
    if (!key) {
      setVerifyError('Enter the license key from your Gumroad receipt email.');
      return;
    }
    setVerifying(true);
    setVerifyError('');
    try {
      const res = await api('/verify-tip', { method: 'POST', body: { licenseKey: key } });
      if (res && res.ok) {
        setSupporter(); // dawn_supporter="1" — the strip stays visible until the user hides it
        setStoredTipKey(key); // keep the key for pre-fill + copy/reuse
        setLicenseKey(key);
        setIsVerified(true);
        toastSuccess("☕ Thanks for tipping — you're a supporter now!");
      } else {
        setVerifyError("That key didn't verify — check the license key in your Gumroad receipt email.");
      }
    } catch (e) {
      setVerifyError(
        e && e.status === 0
          ? 'Could not reach the server. Check your connection and try again.'
          : "That key didn't verify — check the license key in your Gumroad receipt email."
      );
    } finally {
      setVerifying(false);
    }
  };

  // The "Hide sponsored strip" toggle — the only way the hidden flag
  // gets set now. The stored supporter flag and license key are untouched.
  const handleToggleHideStrip = (e) => {
    const on = e.target.checked;
    setSponsoredHidden(on);
    setHideStrip(on);
  };

  const handleCopyKey = async () => {
    const key = licenseKey.trim();
    if (!key) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(key);
      ok = true;
    } catch {
      // Clipboard API unavailable (non-secure context) — fallback.
      try {
        const ta = document.createElement('textarea');
        ta.value = key;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toastError('Could not copy — select the key manually.');
    }
  };

  return (
    <React.Fragment>
      <Menu>
        <MenuButton
          as={IconButton}
          size='sm'
          aria-label='More options'
          title='More options'
          icon={<Ellipsis size={18} />}
          variant='holdr'
        />
        <MenuList>
          {backend !== false && (user?.id ? (
            <MenuItem icon={<LogOut size={16} />} onClick={handleLogout}>
              <Flex w='100%' justify='space-between' align='center' gap={6}>
                <Text>Sign out</Text>
                <Text fontSize='xs' color='dimmed' noOfLines={1} maxW='180px'>{user.email}</Text>
              </Flex>
            </MenuItem>
          ) : (
            <MenuItem icon={<LogIn size={16} />} onClick={() => setAuthOpen(true)}>
              Sign in
            </MenuItem>
          ))}
          {backend !== false && <MenuDivider />}
          <MenuItem
            icon={<Pencil size={16} />}
            onClick={toggleEdit}
            closeOnSelect={false}
          >
            <Flex w='100%' justify='space-between' align='center' gap={6}>
              <Text>Edit mode</Text>
              {setting.isEditing && <Check size={16} />}
            </Flex>
          </MenuItem>
          <MenuItem
            icon={<Trash2 size={16} />}
            onClick={() => setConfirmOpen(true)}
            isDisabled={data.length < 1}
          >
            <Text color='red.400'>Delete all</Text>
          </MenuItem>
          <MenuItem icon={<BadgeCheck size={16} />} onClick={openSponsoredModal}>
            Supporter
          </MenuItem>
          <MenuDivider />
          <MenuItem
            as='a'
            href='https://dawnlimited.gumroad.com/l/clipbin-tip'
            target='_blank'
            rel='noopener'
            icon={<Coffee size={16} />}
          >
            ☕ Tip jar
          </MenuItem>
          <MenuItem
            as='a'
            href='https://github.com/hectorchanht/clipbin'
            target='_blank'
            rel='noopener noreferrer'
            icon={<GithubIcon boxSize='16px' />}
          >
            Source code
          </MenuItem>
        </MenuList>
      </Menu>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete all entries?</ModalHeader>
          <ModalBody>
            <Text>
              This removes everything {userId ? 'from your cloud clipboard' : 'stored on this device'}. This can&apos;t be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button colorScheme='red' ml={3} onClick={handleClearData}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={sponsoredOpen} onClose={() => setSponsoredOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Supporter</ModalHeader>
          <ModalBody>
            {isVerified ? (
              <React.Fragment>
                <Text mb={3} fontWeight='600'>☕ You&apos;re a supporter — thanks for tipping!</Text>
                <Flex align='center' justify='space-between' mb={1}>
                  <Text fontSize='sm'>Hide sponsored strip</Text>
                  <Switch
                    isChecked={hideStrip}
                    onChange={handleToggleHideStrip}
                    colorScheme='teal'
                    aria-label='Hide sponsored strip'
                  />
                </Flex>
                <Text fontSize='xs' color='dimmed' mb={3}>
                  Supporters can hide the strip anytime.
                </Text>
              </React.Fragment>
            ) : (
              <Text mb={3}>
                Tipped us on Gumroad? Enter the license key from your purchase receipt email to verify your support.
              </Text>
            )}
            <Flex gap={2} align='center'>
              <Input
                placeholder='Gumroad license key'
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyTip(); }}
                isDisabled={verifying}
                autoComplete='off'
                spellCheck={false}
              />
              <IconButton
                aria-label='Copy license key'
                title='Copy the license key for reuse'
                icon={copied ? <Check size={16} /> : <Copy size={16} />}
                onClick={handleCopyKey}
                isDisabled={!licenseKey.trim()}
                variant='holdr'
              />
            </Flex>
            {copied && (
              <Text color='green.400' fontSize='sm' mt={1}>
                Copied
              </Text>
            )}
            {verifyError && (
              <Text color='red.400' fontSize='sm' mt={2}>
                {verifyError}
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            {isVerified ? (
              <Button variant='ghost' onClick={() => setSponsoredOpen(false)}>
                Done
              </Button>
            ) : (
              <React.Fragment>
                <Button variant='ghost' onClick={() => setSponsoredOpen(false)}>
                  Cancel
                </Button>
                <Button
                  colorScheme='teal'
                  ml={3}
                  onClick={handleVerifyTip}
                  isLoading={verifying}
                  isDisabled={!licenseKey.trim()}
                >
                  Verify
                </Button>
              </React.Fragment>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </React.Fragment>
  );
};

export default HeaderMoreMenu;
