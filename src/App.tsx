import { Box, ChakraProvider, Container, extendTheme, Flex, Heading, Image, Spacer, Stack } from "@chakra-ui/react";
import * as React from "react";
import Auth from "./Components/Auth";
import ClipboardList from "./Components/ClipboardList";
import HeaderMoreMenu from "./Components/HeaderMoreMenu";
import ImageSection from "./Components/ImageSection";
import PaginationTool from "./Components/PaginationTool";
import PostFromClipboard from "./Components/PostFromClipboard";
import PostFromText from './Components/PostFromText';
import { useDataLoader, useSettingsSync } from './libs/fns';
import { useAuthSession } from './libs/useAuthSession';

const theme = extendTheme({ config: { initialColorMode: "dark", useSystemColorMode: true } });

// Mounted once inside ChakraProvider: runs the single global data fetch
// and keeps settings in sync (load on login change, auto-save on edit).
const DataLoader = () => {
  useDataLoader();
  useSettingsSync();
  return null;
};

export const App = () => {
  // Syncs the backend session into state; login/logout (incl. magic-link
  // redirects) automatically refetch data — no polling hacks needed.
  useAuthSession();

  return (
    <ChakraProvider theme={theme}>
      <DataLoader />
      <Container textAlign="center" fontSize="xl" my={4} display={'flex'} flexDirection={'column'} height={'100vh'}>
        <Box as={'main'} flex={1}>

          <Stack spacing={4}>
            <Flex as={'header'} align='center' gap={2.5} mt={1} mb={1}>
              <Image src='/logo.png' alt='Clipbin logo' boxSize='36px' borderRadius='md' />
              <Heading
                as='h1'
                fontSize='2xl'
                fontWeight='extrabold'
                letterSpacing='tight'
                bgGradient='linear(to-r, teal.200, cyan.400)'
                bgClip='text'
                filter='drop-shadow(0 0 10px rgba(45, 212, 191, 0.25))'
              >
                Clipbin
              </Heading>
              <Spacer />
              <HeaderMoreMenu />
            </Flex>

            <Auth />

            <PostFromText />
            <PostFromClipboard />
            <ImageSection />
            <PaginationTool />
            <ClipboardList />
          </Stack>
        </Box>
      </Container>
    </ChakraProvider>
  );
};
