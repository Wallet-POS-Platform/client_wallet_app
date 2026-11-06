/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#141f17',
    tint: '#2b5c38',
    background: '#fafaf7',
    foreground: '#141f17',
    card: '#ffffff',
    cardForeground: '#141f17',
    primary: '#2b5c38',
    primaryForeground: '#ffffff',
    secondary: '#f2f4f0',
    secondaryForeground: '#141f17',
    muted: '#f2f4f0',
    mutedForeground: '#7a857d',
    accent: '#e8f2e5',
    accentForeground: '#2b5c38',
    destructive: '#b8473d',
    destructiveForeground: '#ffffff',
    border: '#e3e8e3',
    input: '#e3e8e3',
    walletText: '#e8f2e5',
    disabledSurface: '#ebedeb',
    disabledText: '#99a19c',
    scrim: 'rgba(20, 31, 23, 0.36)',
  },
  radius: 20,
};

export default colors;
