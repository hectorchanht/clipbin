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

/**
 * Holdr-style button variants: bordered icon buttons with hover tooltips
 * (like Holdr's headerBtn), plus an emerald solid primary.
 */
const holdrBtn = (props: any) =>
  props.colorMode === 'dark'
    ? {
        border: '1px solid #3f3f46',
        bg: '#27272a',
        color: '#d4d4d8',
        borderRadius: '0.5rem',
        _hover: { bg: '#3f3f46', _disabled: { bg: '#27272a' } },
        _active: { bg: '#52525b' },
      }
    : {
        border: '1px solid #d4d4d8',
        bg: '#e4e4e7',
        color: '#3f3f46',
        borderRadius: '0.5rem',
        _hover: { bg: '#d4d4d8', _disabled: { bg: '#e4e4e7' } },
        _active: { bg: '#a1a1aa' },
      };

const holdrDanger = (props: any) =>
  props.colorMode === 'dark'
    ? {
        border: '1px solid #7f1d1d',
        bg: '#27272a',
        color: '#f87171',
        borderRadius: '0.5rem',
        _hover: { bg: '#3f3f46', _disabled: { bg: '#27272a' } },
        _active: { bg: '#52525b' },
      }
    : {
        border: '1px solid #fecaca',
        bg: '#fef2f2',
        color: '#dc2626',
        borderRadius: '0.5rem',
        _hover: { bg: '#fee2e2', _disabled: { bg: '#fef2f2' } },
        _active: { bg: '#fecaca' },
      };

const holdrPrimary = () => ({
  bg: '#059669',
  color: '#fff',
  borderRadius: '0.5rem',
  _hover: { bg: '#10b981', _disabled: { bg: '#059669' } },
  _active: { bg: '#047857' },
});

const theme = extendTheme({
  config: { initialColorMode: "dark", useSystemColorMode: true },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#09090b' : '#ffffff',
        color: props.colorMode === 'dark' ? '#f4f4f5' : '#18181b',
      },
    }),
  },
  components: {
    IconButton: {
      variants: { holdr: holdrBtn, holdrDanger, holdrPrimary },
    },
    Button: {
      variants: { holdr: holdrBtn, holdrDanger, holdrPrimary },
    },
  },
});

// Mounted once inside ChakraProvider: runs the single global data fetch
// and keeps settings in sync (load on login change, auto-save on edit).
const DataLoader = () => {
  useDataLoader();
  useSettingsSync();
  return null;
};

const AppHeader = () => {
  return (
    <Flex as={'header'} align='center' gap={2} mt={0.5} mb={0.5}>
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
