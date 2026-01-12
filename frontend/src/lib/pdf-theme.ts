// Apple-inspired PDF Design System
// Based on Apple's design language: extreme restraint, perfect typography, invisible grid system

export const pdfTheme = {
  colors: {
    primary: '#1D1D1F', // Apple black - primary text
    secondary: '#86868B', // Apple gray - secondary text
    accent: '#0071E3', // Apple blue - quote number and key CTAs
    success: '#34C759', // Apple green - approved status
    successBg: '#34C75915', // 15% opacity green for badge background
    border: '#E5E5E7', // Subtle dividers
    backgroundAlt: '#F5F5F7', // Subtle gray sections
    white: '#FFFFFF',
  },
  fonts: {
    family: 'Inter',
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
    },
  },
  spacing: (n: number) => n * 8, // 8px grid system
  borderRadius: {
    card: 12,
    badge: 20, // Pill shape for status badges
  },
  typography: {
    quoteNumber: {
      fontSize: 42,
      fontWeight: 300,
      letterSpacing: 0.02, // +0.02em tracking
      lineHeight: 1.2,
    },
    quoteLabel: {
      fontSize: 10,
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.1, // 0.1em for uppercase
      lineHeight: 1.4,
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.1, // 0.1em for uppercase
      lineHeight: 1.4,
    },
    body: {
      fontSize: 12,
      fontWeight: 400,
      lineHeight: 1.5, // Perfect readability
    },
    label: {
      fontSize: 11,
      fontWeight: 500,
      lineHeight: 1.4,
    },
    value: {
      fontSize: 12,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    tableHeader: {
      fontSize: 10,
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.05,
      lineHeight: 1.4,
    },
    tableCell: {
      fontSize: 12,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    total: {
      fontSize: 13,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    grandTotal: {
      fontSize: 20,
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: -0.01, // Slightly tighter for large numbers
    },
    terms: {
      fontSize: 10,
      fontWeight: 400,
      lineHeight: 1.5,
    },
  },
};
