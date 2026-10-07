import { Box, useColorModeValue } from '@chakra-ui/react';
import React from 'react';

/**
 * Playful Clipbin wordmark lockup — a real logo, not just a font:
 * the balloon-paperclip mark tilted at a jaunty angle, "Clipbin" set heavy
 * with a per-letter bounce, a sticker outline, a teal→cyan gradient fill,
 * a hand-drawn wavy underline and a little sparkle. Wiggles on hover.
 */
const WordmarkLogo = () => {
  // Purple like the balloon-paperclip logo mark.
  const gradFrom = useColorModeValue('#7c3aed', '#a78bfa');
  const gradTo = useColorModeValue('#a855f7', '#e879f9');
  const sticker = useColorModeValue('#4c1d95', 'rgba(255,255,255,0.95)');
  const sparkle = '#fbbf24';
  const gradId = 'cb-wordmark-grad';

  // Alternating rise so each letter sits at 0 or -3 (sums back to baseline).
  const bounce = [0, -3, 3, -3, 3, -3, 3];
  const letters = 'Clipbin'.split('');

  return (
    <Box
      as='span'
      display='inline-flex'
      alignItems='center'
      aria-label='Clipbin'
      sx={{
        '& > svg': { transition: 'transform 0.25s ease', display: 'block' },
        '&:hover > svg': { transform: 'rotate(-2.5deg) scale(1.05)' },
      }}
    >
      <svg viewBox='0 0 200 52' height='40' role='img' aria-label='Clipbin'>
        <defs>
          <linearGradient id={gradId} x1='0' y1='0' x2='1' y2='1'>
            <stop offset='0' stopColor={gradFrom} />
            <stop offset='1' stopColor={gradTo} />
          </linearGradient>
        </defs>

        {/* The balloon-paperclip mark, tilted for playfulness. */}
        <g transform='rotate(-8 24 26)'>
          <image href='/logo.png' x='4' y='6' width='40' height='40' />
        </g>

        {/* Little sparkle peeking out by the mark. */}
        <path
          d='M50 3 l1.9 4.4 4.4 1.9 -4.4 1.9 -1.9 4.4 -1.9 -4.4 -4.4 -1.9 4.4 -1.9 z'
          fill={sparkle}
        />

        {/* Wordmark: heavy rounded letters with a bounce + sticker outline. */}
        <text
          x='56'
          y='33'
          fontSize='30'
          fontWeight='900'
          fontFamily="'Baloo 2','Nunito','Arial Rounded MT Bold','Comic Sans MS',system-ui,sans-serif"
          letterSpacing='-0.5'
          fill={`url(#${gradId})`}
          stroke={sticker}
          strokeWidth='5'
          paintOrder='stroke'
          strokeLinejoin='round'
        >
          {letters.map((ch, i) => (
            <tspan key={i} dy={bounce[i]}>
              {ch}
            </tspan>
          ))}
        </text>

        {/* Hand-drawn wavy underline. */}
        <path
          d='M58 41 q7 -5 14 0 t14 0 t14 0 t14 0 t14 0 t14 0 t14 0 t14 0'
          fill='none'
          stroke={`url(#${gradId})`}
          strokeWidth='3'
          strokeLinecap='round'
        />
      </svg>
    </Box>
  );
};

export default WordmarkLogo;
