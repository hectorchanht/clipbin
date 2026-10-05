import { CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import { Button, Grid, GridItem, Skeleton, Text, Textarea } from '@chakra-ui/react';
import React from 'react';
import useClipboard from '../libs/useClipboard';
import { deleteData, patchData, useData } from '../libs/fns';

const LocalGrid = ({ children, ...rest }) => (
  <Grid
    templateColumns='repeat(6, 1fr)'
    gap={3}
    alignItems={'center'}
    textAlign={'left'}
    mt={4}
    {...rest}
  >
    {children}
  </Grid>
);

const RenderLoadingData = (props) => (
  <LocalGrid {...props}>
    {[...Array(5)].map((_, i) => (
      <React.Fragment key={i}>
        <GridItem colSpan={1}>
          <Skeleton height='50px' width={'60px'} />
        </GridItem>
        <GridItem colSpan={1}>
          <Skeleton height='50px' width={'60px'} />
        </GridItem>
        <GridItem colSpan={4}>
          <Skeleton height='80px' />
        </GridItem>
      </React.Fragment>))}
  </LocalGrid>
);

const formatDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
};

const ClipboardRow = ({ entry }) => {
  const [, copyToClipboard] = useClipboard({ updateFrequency: 64 });
  const {
    updateData, data, isLoading, setIsLoading,
    setting, setSetting, userId, toastError, toastSuccess,
  } = useData();
  const [draft, setDraft] = React.useState(entry.val);
  const [saving, setSaving] = React.useState(false);

  const isEditing = setting.isEditing;
  const isDirty = draft !== entry.val;

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await patchData({ id: entry.id, val: draft }, userId);
      toastSuccess('Entry updated');
      updateData();
    } catch (e) {
      toastError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => setDraft(entry.val);

  const handleDelete = async () => {
    setIsLoading((d) => ({ ...d, delete: true }));
    try {
      await deleteData(entry.id, userId);
      // Don't strand the user on an empty page after deleting its last row.
      if (data.length <= 1 && setting.currentPage > 1) {
        setSetting((d) => ({ ...d, currentPage: d.currentPage - 1 }));
      } else {
        updateData();
      }
    } catch (e) {
      toastError(e.message);
    } finally {
      setIsLoading((d) => ({ ...d, delete: false }));
    }
  };

  return (
    <React.Fragment>
      <GridItem rowSpan={1}>
        <Button aria-label='Copy to clipboard' onClick={() => copyToClipboard(entry.val)}>
          <CopyIcon />
        </Button>
      </GridItem>
      <GridItem colSpan={1}>
        <Button
          aria-label='Delete entry'
          onClick={handleDelete}
          isLoading={isLoading.delete}
        >
          <DeleteIcon />
        </Button>
      </GridItem>
      <GridItem colSpan={4}>
        <Textarea
          value={isEditing ? draft : entry.val}
          isReadOnly={!isEditing}
          onChange={isEditing ? (e) => setDraft(e.target.value) : undefined}
        />
        <Text fontSize='xs' color='gray.500' mt={1}>
          {formatDate(entry.created_at)}
        </Text>
        {isEditing && isDirty && (
          <Grid templateColumns='repeat(2, 1fr)' gap={2} mt={2}>
            <Button size='sm' colorScheme='green' isLoading={saving} onClick={handleSaveEdit}>
              Save
            </Button>
            <Button size='sm' variant='ghost' isDisabled={saving} onClick={handleCancelEdit}>
              Cancel
            </Button>
          </Grid>
        )}
      </GridItem>
    </React.Fragment>
  );
};

const ClipboardList = () => {
  const { data, isLoading } = useData();

  if (isLoading.get) {
    return <RenderLoadingData />;
  }

  if (data.length === 0) {
    return (
      <Text color='gray.500' mt={8}>
        Nothing here yet — paste something above to save it.
      </Text>
    );
  }

  return (
    <LocalGrid>
      {data.map((d) => (
        <ClipboardRow key={d.id} entry={d} />
      ))}
    </LocalGrid>
  );
};

export default ClipboardList;
