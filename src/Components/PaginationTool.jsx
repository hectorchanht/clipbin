import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { Flex, IconButton, Select, Text } from '@chakra-ui/react';
import React from 'react';
import { useData } from '../libs/fns';

const PAGE_SIZES = [5, 10, 20, 50, 100];

const PaginationTool = () => {
  const { hasMore, isLoading, setting, setSetting } = useData();

  const { currentPage, pageSize } = setting;

  const handleSelectChange = (e) => {
    const size = Number(e.target.value);
    if (size < 1) return;
    setSetting((d) => ({ ...d, pageSize: size, currentPage: 1 }));
  };

  return (
    <Flex align='center' gap={2}>
      <IconButton
        aria-label='Previous page'
        title='Previous page'
        icon={<ArrowBackIcon />}
        variant='outline'
        isLoading={isLoading.get}
        isDisabled={currentPage <= 1}
        onClick={() => setSetting((d) => ({ ...d, currentPage: d.currentPage - 1 }))}
      />

      <Text fontSize='sm' color='gray.500' whiteSpace='nowrap'>
        Page {currentPage}
      </Text>

      <Select
        aria-label='Entries per page'
        placeholder={`page size: ${pageSize}`}
        onChange={handleSelectChange}
        value={PAGE_SIZES.includes(pageSize) ? pageSize : ''}
        maxW='150px'
      >
        {PAGE_SIZES.map((d) => <option key={d} value={d}>{d}</option>)}
      </Select>

      <IconButton
        aria-label='Next page'
        title='Next page'
        icon={<ArrowForwardIcon />}
        variant='outline'
        isDisabled={!hasMore}
        isLoading={isLoading.get}
        onClick={() => setSetting((d) => ({ ...d, currentPage: d.currentPage + 1 }))}
      />
    </Flex>
  );
};

export default PaginationTool;
