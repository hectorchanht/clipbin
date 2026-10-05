import { EditIcon } from '@chakra-ui/icons';
import { Button } from '@chakra-ui/react';
import React from 'react';
import { useData } from '../../libs/fns';

const IsEditingBtn = () => {
  const { setting, setSetting, toast } = useData();

  const handleEdit = () => {
    if (setting.isEditing) {
      setSetting(d => ({ ...d, isEditing: !d.isEditing }))
      toast({ title: 'Editable Turn Off' })
    } else {
      setSetting(d => ({ ...d, isEditing: !d.isEditing }))
      toast({ title: 'Editable Turn On' })
    }

  };

  return (
    <Button onClick={handleEdit} colorScheme={'green'}>
      <EditIcon />
    </Button>
  )
};

export default IsEditingBtn;


