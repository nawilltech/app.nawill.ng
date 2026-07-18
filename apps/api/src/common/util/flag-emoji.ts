const REGIONAL_INDICATOR_OFFSET = 0x1f1e6 - 'A'.charCodeAt(0);

/** ISO 3166-1 alpha-2 -> flag emoji (e.g. "NG" -> "🇳🇬"), via the regional-indicator trick. */
export function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET))
    .join('');
}
