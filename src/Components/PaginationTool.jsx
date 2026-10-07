import { Flex, IconButton, Select, Text } from '@chakra-ui/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
        size='sm'
        aria-label='Previous page'
        title='Previous page'
        icon={<ArrowLeft size={16} />}
        variant='holdr'
        isLoading={isLoading.get}
        isDisabled={currentPage <= 1}
        onClick={() => setSetting((d) => ({ ...d, currentPage: d.currentPage - 1 }))}
      />

      <Text fontSize='xs' color='dimmed' whiteSpace='nowrap'>
        Page {currentPage}
      </Text>

      <Select
        size='sm'
        aria-label='Entries per page'
        title='Entries per page'
        placeholder={`page size: ${pageSize}`}
        onChange={handleSelectChange}
        value={PAGE_SIZES.includes(pageSize) ? pageSize : ''}
        maxW='120px'
      >
        {PAGE_SIZES.map((d) => <option key={d} value={d}>{d}</option>)}
      </Select>

      <IconButton
        size='sm'
        aria-label='Next page'
        title='Next page'
        icon={<ArrowRight size={16} />}
        variant='holdr'
        isDisabled={!hasMore}
        isLoading={isLoading.get}
        onClick={() => setSetting((d) => ({ ...d, currentPage: d.currentPage + 1 }))}
      />
    </Flex>
  );
};

export default PaginationTool;
