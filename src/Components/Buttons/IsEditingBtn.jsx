import { EditIcon } from '@chakra-ui/icons';
import { Button } from '@chakra-ui/react';
import React from 'react';
import { useData } from '../../libs/fns';

const IsEditingBtn = () => {
  const { setting, setSetting, toast } = useData();

  const handleEdit = () => {
    const next = !setting.isEditing;
    setSetting((d) => ({ ...d, isEditing: next }));
    toast({ title: next ? 'Editable Turn On' : 'Editable Turn Off' });
  };

  return (
    <Button
      onClick={handleEdit}
      variant='ghost'
      colorScheme='teal'
      isActive={setting.isEditing}
      aria-label='Toggle edit mode'
      title='Toggle edit mode'
    >
      <EditIcon />
    </Button>
  );
};

export default IsEditingBtn;
