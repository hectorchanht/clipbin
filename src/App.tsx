import { ChakraProvider, Container, extendTheme, Flex, Heading, Image, Spacer, Stack, useColorModeValue } from "@chakra-ui/react";
import * as React from "react";
import Auth from "./Components/Auth";
import ClipboardList from "./Components/ClipboardList";
import ComposeRow from "./Components/ComposeRow";
import HeaderMoreMenu from "./Components/HeaderMoreMenu";
import ImageSection from "./Components/ImageSection";
import PaginationTool from "./Components/PaginationTool";
import PostImage from "./Components/PostImage";
import { ColorModeSwitcher } from "./ColorModeSwitcher";
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

const AppHeader = () => {
  const gradient = useColorModeValue('linear(to-r, teal.600, cyan.600)', 'linear(to-r, teal.200, cyan.400)');
  return (
    <Flex as={'header'} align='center' gap={1} mt={0.5} mb={0.5}>
      <Image src='/logo.png' alt='Clipbin logo' boxSize='28px' borderRadius='md' />
      <Heading
        as='h1'
        fontSize='lg'
        fontWeight='extrabold'
        letterSpacing='tight'
        bgGradient={gradient}
        bgClip='text'
      >
        Clipbin
      </Heading>
      <Spacer />
      <ColorModeSwitcher />
      <HeaderMoreMenu />
    </Flex>
  );
};

export const App = () => {
  // Syncs the backend session into state; login/logout (incl. magic-link
  // redirects) automatically refetch data — no polling hacks needed.
  useAuthSession();

  return (
    <ChakraProvider theme={theme}>
      <DataLoader />
      <Container maxW='container.md' px={3} my={1} display={'flex'} flexDirection={'column'} minH={'100vh'}>
        <AppHeader />
        <Auth />

        <Stack spacing={1.5} mt={1} flex={1}>
          <PostImage />
          <ComposeRow />
          <ImageSection />
          <PaginationTool />
          <ClipboardList />
        </Stack>
      </Container>
    </ChakraProvider>
  );
};
