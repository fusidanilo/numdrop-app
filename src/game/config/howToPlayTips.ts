export interface HowToPlayTip {
  title: string;
  body: string;
}

/** Tips shown one per page (HowToPlayTipsPager). */
export const HOW_TO_PLAY_TIPS: readonly HowToPlayTip[] = [
  {
    title: 'How to play',
    body:
      'Tiles fall in three colors. Match each falling number with the small badge of that color in the top-right — chains go 1 → 9 → 1.',
  },
  {
    title: 'Wrong taps',
    body:
      "Tapping the wrong number resets that color's chain to 1 and drops your combo multiplier back to ×1.",
  },
  {
    title: 'Lives',
    body:
      "If the tile showing your color's next number reaches the bottom without being tapped, you lose a heart. Other numbers can fall away safely.",
  },
  {
    title: 'Combo & power-ups',
    body:
      'Every correct hit raises your combo for more points. Every 10 correct hits in a row earns a power-up — tap the icons along the bottom when you need them.',
  },
];
