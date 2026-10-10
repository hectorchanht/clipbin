import { Button, Flex, Text } from '@chakra-ui/react';
import React from 'react';
import {
  SPONSORED_HIDDEN_EVENT,
  hasAiraloLink,
  hasAirwallexLink,
  hasBinanceLink,
  hasCoinbaseLink,
  hasKoinlyLink,
  hasTipJarLink,
  hasWiseLink,
  isSponsoredHidden,
  sponsoredLinks,
} from '../libs/sponsored';

/**
 * Slim moneyrate-style sponsored strip: the first content block under the
 * app header. One row, horizontally scrollable on narrow screens (no
 * clipped buttons), tiny uppercase disclosure label, brand-colored slots.
 *
 * Renders nothing when localStorage dawn_sponsored_hidden === '1' — that
 * flag is set only after the tip-jar license key is verified (header ⋯
 * menu → "Sponsored strip"). No honor-system dismiss button anymore.
 *
 * A slot renders only when its URL is set in ../libs/sponsored.
 */
const SponsoredStrip = () => {
  const [hidden, setHidden] = React.useState(isSponsoredHidden());

  React.useEffect(() => {
    const sync = () => setHidden(isSponsoredHidden());
    window.addEventListener(SPONSORED_HIDDEN_EVENT, sync);
    return () => window.removeEventListener(SPONSORED_HIDDEN_EVENT, sync);
  }, []);

  if (hidden) return null;

  const slots = [];
  if (hasTipJarLink()) {
    slots.push({
      key: 'tipjar',
      label: '☕ Tip jar',
      title: 'Support ClipBin — tip jar',
      href: sponsoredLinks.tipJar,
      bg: '#F0A832',
      color: '#000000',
      rel: 'noopener',
    });
  }
  if (hasWiseLink()) {
    slots.push({
      key: 'wise',
      label: 'Send money abroad',
      title: 'Wise — send money abroad',
      href: sponsoredLinks.wise,
      bg: '#9FE870',
      color: '#000000',
      rel: 'noopener sponsored',
    });
  }
  if (hasCoinbaseLink()) {
    slots.push({
      key: 'coinbase',
      label: 'Buy crypto',
      title: 'Coinbase — buy crypto',
      href: sponsoredLinks.coinbase,
      bg: '#0052FF',
      color: '#ffffff',
      rel: 'noopener sponsored',
    });
  }
  if (hasBinanceLink()) {
    slots.push({
      key: 'binance',
      label: 'Trade on Binance',
      title: 'Binance — trade crypto',
      href: sponsoredLinks.binance,
      bg: '#F0B90B',
      color: '#000000',
      rel: 'noopener sponsored',
    });
  }
  if (hasAiraloLink()) {
    slots.push({
      key: 'airalo',
      label: 'eSIM data',
      title: 'Airalo — eSIM data',
      href: sponsoredLinks.airalo,
      bg: '#0F172A',
      color: '#ffffff',
      rel: 'noopener sponsored',
    });
  }
  if (hasKoinlyLink()) {
    slots.push({
      key: 'koinly',
      label: 'Crypto taxes',
      title: 'Koinly — crypto taxes',
      href: sponsoredLinks.koinly,
      bg: '#00C09E',
      color: '#000000',
      rel: 'noopener sponsored',
    });
  }
  if (hasAirwallexLink()) {
    slots.push({
      key: 'airwallex',
      label: 'Global accounts',
      title: 'Airwallex — global accounts',
      href: sponsoredLinks.airwallex,
      bg: '#5C28FF',
      color: '#ffffff',
      rel: 'noopener sponsored',
    });
  }

  // Nothing to promote — the tip jar URL is always set, so this only
  // fires if someone empties the whole config.
  if (slots.length === 0) return null;

  return (
    <Flex
      align='center'
      gap={1.5}
      px={1}
      py={1.5}
      mt={0.5}
      overflowX='auto'
      flexWrap='nowrap'
      css={{
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      aria-label='Sponsored links'
    >
      <Text
        fontSize='10px'
        textTransform='uppercase'
        letterSpacing='0.08em'
        color='dimmed'
        flexShrink={0}
        pl={1}
      >
        Sponsored
      </Text>
      {slots.map((s) => (
        <Button
          key={s.key}
          as='a'
          href={s.href}
          target='_blank'
          rel={s.rel}
          title={s.title}
          size='xs'
          flexShrink={0}
          bg={s.bg}
          color={s.color}
          fontSize='11px'
          fontWeight='600'
          borderRadius='full'
          _hover={{ filter: 'brightness(1.06)' }}
          _active={{ filter: 'brightness(0.96)' }}
        >
          {s.label}
        </Button>
      ))}
    </Flex>
  );
};

export default SponsoredStrip;
