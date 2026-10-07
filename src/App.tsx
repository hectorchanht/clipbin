import { ChakraProvider, Container, extendTheme, Flex, Spacer, Stack } from "@chakra-ui/react";
import * as React from "react";
import Auth from "./Components/Auth";
import ClipboardList from "./Components/ClipboardList";
import ComposeRow from "./Components/ComposeRow";
import HeaderMoreMenu from "./Components/HeaderMoreMenu";
import ImageSection from "./Components/ImageSection";
import PaginationTool from "./Components/PaginationTool";
import PostImage from "./Components/PostImage";
import WordmarkLogo from "./Components/WordmarkLogo";
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
  return (
    <Flex as={'header'} align='center' gap={1} mt={0.5} mb={0.5}>
      <WordmarkLogo />
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
