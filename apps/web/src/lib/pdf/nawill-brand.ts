/** Static company facts for the invoice PDF — sourced from nawill.ng and a set of reference invoice PDFs (not kept in the repo). */
export const NAWILL_COMPANY = {
  name: 'Nawill Technology Ltd.',
  address: '4, Akinshola Street, Yaba, Lagos, Nigeria',
  email: 'info@nawill.ng',
  phone: '+234 901 851 5257',
  website: 'nawill.ng',
};

export const NAWILL_PAYMENT_DETAILS = {
  bank: 'Zenith Bank',
  accountName: 'Nawill Technology Ltd',
  accountNumber: '1214977832',
};

/**
 * Sourced from the enhanced brand identity guide supplied for this build (not kept
 * in the repo — see docs/ARCHITECTURE.md §8.8). `brandDark` is a computed hover-darken
 * of `brand` (the guide shows no explicit hover shade for the primary navy).
 * `green`/`red` are functional (paid/outstanding), not brand colors, chosen to sit
 * comfortably alongside the Ink/Cream/Paper/Nawill Blue palette.
 */
export const PDF_COLORS = {
  navy: '#20264a', // "Ink" — primary
  navyBorder: '#3a4270', // border/divider on navy backgrounds
  brand: '#20264a',
  brandDark: '#161a34',
  accent: '#4757b8', // "Nawill Blue" — table header, links
  lavender: '#8e9bd8', // muted text on navy backgrounds
  rowAlt: '#fbf9f2', // lightest tint of Cream
  gold: '#7a7256', // olive/gold — secondary labels
  beige: '#d8cfb4', // light tint of Paper
  green: '#1a7a3c',
  red: '#b3261e',
  textMuted: '#6b7280',
  border: '#e5e7eb',
};
