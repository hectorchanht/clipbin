import { ChevronUpIcon, SettingsIcon } from '@chakra-ui/icons';
import { Box, Button, Flex } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import React from 'react';
import { DeleteBtn, IsEditingBtn } from '../Components/Buttons';
import { getSettingData, saveSettingData, useData } from '../libs/fns';
import { settingAtom } from '../libs/states';

/**
 * Settings persist automatically (debounced) — no save button needed.
 * Skips the first render so the initial load never writes back.
 */
const useAutoSaveSettings = () => {
  const [setting] = useAtom(settingAtom);
  const { userId } = useData();
  const first = React.useRef(true);

  React.useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      saveSettingData(setting, userId).catch(() => {
        // Quiet: settings are a nice-to-have, never block the UI.
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [setting, userId]);
};

const Toolbar = () => {
  const { setting, setSetting, userId, toastError } = useData();
  useAutoSaveSettings();

  // Load settings when the account changes (login / logout), not on every data update.
  React.useEffect(() => {
    let cancelled = false;
    getSettingData(userId)
      .then((s) => { if (!cancelled) setSetting(s); })
      .catch((e) => { if (!cancelled) toastError(e.message); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggleSettingHidden = () => setSetting((d) => ({ ...d, isSettingHidden: !d.isSettingHidden }));

  return setting?.isSettingHidden
    ? (
      <Box as={'span'} my={4}>
        <Button
          mx={4}
          variant='ghost'
          colorScheme='blue'
          onClick={toggleSettingHidden}
          aria-label='Show settings'
          title='Show settings'
        >
          <SettingsIcon />
        </Button>
      </Box>
    )
    : (
      <Flex justifyContent={'space-between'} my={4}>
        <Button
          variant='ghost'
          onClick={toggleSettingHidden}
          aria-label='Hide settings'
          title='Hide settings'
        >
          <ChevronUpIcon />
        </Button>
        <DeleteBtn />
        <IsEditingBtn />
      </Flex>
    );
};

export default Toolbar;
