import { StarIcon } from '@chakra-ui/icons';
import { Button } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import React from 'react';
import { saveSettingData, useData } from '../../libs/fns';
import { settingAtom } from '../../libs/states';


const SaveSettingBtn = () => {
  const [setting] = useAtom(settingAtom);
  const { userId, toastError, toastSuccess } = useData();
  const [saving, setSaving] = React.useState(false);

  const saveSetting = async () => {
    setSaving(true);
    try {
      const where = await saveSettingData(setting, userId);
      toastSuccess(where === 'cloud' ? 'Setting saved in cloud' : 'Setting saved locally');
    } catch (e) {
      toastError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button colorScheme='blue' onClick={saveSetting} isLoading={saving} aria-label='Save settings'>
      <StarIcon />
    </Button>
  );
};

export default SaveSettingBtn;
