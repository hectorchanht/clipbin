import { ArrowBackIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { Button, Flex, Select } from '@chakra-ui/react';
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
    <Flex>
      <Button
        colorScheme='pink' variant='solid'
        isLoading={isLoading.get}
        isDisabled={currentPage <= 1}
        onClick={() => setSetting((d) => ({ ...d, currentPage: d.currentPage - 1 }))}
      >
        <ArrowBackIcon />
      </Button>

      <Select
        placeholder={`page size: ${pageSize}`}
        onChange={handleSelectChange}
        value={PAGE_SIZES.includes(pageSize) ? pageSize : ''}
      >
        {PAGE_SIZES.map((d) => <option key={d} value={d}>{d}</option>)}
      </Select>

      <Button
        colorScheme='pink' variant='solid'
        isDisabled={!hasMore}
        isLoading={isLoading.get}
        onClick={() => setSetting((d) => ({ ...d, currentPage: d.currentPage + 1 }))}
      >
        <ArrowForwardIcon />
      </Button>
    </Flex>
  );
};

export default PaginationTool;
