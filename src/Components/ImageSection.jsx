import { Box } from '@chakra-ui/react';
import { useAtom } from 'jotai';
import React from 'react';
import ImageList from './ImageList';
import { useData } from '../libs/fns';
import { getImages } from '../libs/imageStore';
import { imageVersionAtom } from '../libs/states';

const IMAGE_PAGE_SIZE = 12;

/**
 * Owns the image thumbnail grid with its own pagination (ImageList).
 * The upload row (PostImage) lives above the compose box in App —
 * this section is just the grid. Refreshes whenever imageVersionAtom
 * is bumped, and refetches on login/logout.
 */
const ImageSection = () => {
  const { userId, toastError } = useData();
  const [imageVersion] = useAtom(imageVersionAtom);
  const [items, setItems] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // New uploads land on page 1 and login state changes the data source.
  React.useEffect(() => {
    setPage(1);
  }, [imageVersion, userId]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { items: rows, hasMore: more } = await getImages({
          page,
          pageSize: IMAGE_PAGE_SIZE,
          userId,
        });
        if (cancelled) return;
        setItems(rows);
        setHasMore(more);
      } catch (e) {
        if (cancelled) return;
        toastError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // toastError is stable; page/userId/imageVersion drive refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, imageVersion, userId]);

  return (
    <Box mt={1} textAlign='left'>
      <ImageList
        items={items}
        loading={loading}
        page={page}
        hasMore={hasMore}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />
    </Box>
  );
};

export default ImageSection;
