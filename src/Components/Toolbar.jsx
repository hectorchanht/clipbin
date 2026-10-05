import { MinusIcon, SettingsIcon } from '@chakra-ui/icons';
import { Box, Button, Flex } from '@chakra-ui/react';
import React from 'react';
import { DeleteBtn, ResetPasswordBtn, SaveSettingBtn, IsEditingBtn } from '../Components/Buttons';
import { getSettingData, useData } from '../libs/fns';


const Toolbar = () => {
  const { setting, setSetting, userId, toastError } = useData();

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
        <Button mx={4} colorScheme={'blue'} onClick={toggleSettingHidden}>
          <SettingsIcon />
        </Button>
        <SaveSettingBtn />
      </Box>
    )
    : (
      <Flex justifyContent={'space-between'} my={4}>
        <Button bg={'transparent'} onClick={toggleSettingHidden}>
          <MinusIcon />
        </Button>
        <DeleteBtn />
        <IsEditingBtn />
        {userId && <ResetPasswordBtn />}
        <SaveSettingBtn />
      </Flex>
    );
};

export default Toolbar;
