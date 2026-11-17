/**
 * Meko Visual Engine 2.0 - controlled palette for stylized 2.5D
 * educational manufacturing animations.
 *
 * Warm cream base, cocoa range for the product, steel neutrals for
 * machinery, and one muted accent per production stage.
 */

export const PAL = {
  // Background / environment
  bgTop: '#FFF3E0',
  bgBottom: '#F2DDBD',
  silhouette: '#E9D2AC',
  silhouetteDeep: '#DFC49B',
  floorTop: '#E2C191',
  floorBottom: '#D3AC77',
  floorLine: '#C29A65',

  // Ink / text
  ink: '#40291B',
  inkSoft: '#6B4A33',

  // Cocoa product states (raw -> roasted -> nib -> paste -> chocolate)
  beanRaw: '#8A5A33',
  beanRawHi: '#A9784D',
  beanRawLo: '#5F3A1C',
  beanRoast: '#5C3A1F',
  beanRoastHi: '#7C4E2B',
  nib: '#6E4324',
  paste: '#4A2A14',
  pasteHi: '#5C351B',
  liquid: '#3B2010',
  liquidHi: '#8A5A33',
  barHi: '#6E4526',

  // Machinery neutrals
  steel: '#DDE2E8',
  steelLo: '#A6AFBA',
  steelDark: '#79828D',
  belt: '#3F3730',
  beltStripe: '#4E453D',
  roller: '#8C8378',

  // Stage accents (1..5)
  accent1: '#E8A33D', // conveyor / intake
  accent2: '#E2654A', // roasting (heat)
  accent3: '#5B8BB5', // grinding (steel blue)
  accent4: '#C07A3C', // conching (copper)
  accent5: '#6BA86B', // molding (finish)

  // Effects
  shadow: 'rgba(64, 41, 27, 0.16)',
  shadowDeep: 'rgba(64, 41, 27, 0.30)',
  glow: 'rgba(255, 176, 88, 0.55)',
  frost: 'rgba(214, 234, 244, 0.85)',
} as const;
