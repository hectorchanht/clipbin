import { Flex, Grid, GridItem, IconButton, Skeleton, Text, Textarea } from '@chakra-ui/react';
import { Check, Copy, Trash2, X } from 'lucide-react';
import React from 'react';
import useClipboard from '../libs/useClipboard';
import { deleteData, patchData, useData } from '../libs/fns';

const LocalGrid = ({ children, ...rest }) => (
  <Grid
    templateColumns='repeat(6, 1fr)'
    gap={2}
    alignItems={'center'}
    textAlign={'left'}
    mt={1}
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
          <Skeleton height='40px' width={'60px'} />
        </GridItem>
        <GridItem colSpan={1}>
          <Skeleton height='40px' width={'60px'} />
        </GridItem>
        <GridItem colSpan={4}>
          <Skeleton height='64px' />
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
        <IconButton
          aria-label='Copy to clipboard'
          title='Copy to clipboard'
          icon={<Copy size={16} />}
          size='sm'
          variant='holdr'
          onClick={() => copyToClipboard(entry.val)}
        />
      </GridItem>
      <GridItem colSpan={1}>
        <IconButton
          aria-label='Delete entry'
          title='Delete entry'
          icon={<Trash2 size={16} />}
          size='sm'
          variant='holdrDanger'
          onClick={handleDelete}
          isLoading={isLoading.delete}
        />
      </GridItem>
      <GridItem colSpan={4}>
        <Textarea
          size='sm'
          value={isEditing ? draft : entry.val}
          isReadOnly={!isEditing}
          onChange={isEditing ? (e) => setDraft(e.target.value) : undefined}
        />
        <Text fontSize='xs' color='gray.500' mt={1}>
          {formatDate(entry.created_at)}
        </Text>
        {isEditing && isDirty && (
          <Flex gap={2} mt={2}>
            <IconButton
              size='sm'
              variant='holdrPrimary'
              aria-label='Save edit'
              title='Save edit'
              icon={<Check size={16} />}
              isLoading={saving}
              onClick={handleSaveEdit}
            />
            <IconButton
              size='sm'
              variant='holdr'
              aria-label='Cancel edit'
              title='Cancel edit'
              icon={<X size={16} />}
              isDisabled={saving}
              onClick={handleCancelEdit}
            />
          </Flex>
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
        Nothing here yet — type above and it saves when you tap away, or tap the clipboard icon to save what&apos;s on your clipboard.
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
