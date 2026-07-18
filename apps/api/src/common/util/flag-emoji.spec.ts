import { flagEmoji } from './flag-emoji';

describe('flagEmoji', () => {
  it('converts an ISO2 code to its regional-indicator flag emoji', () => {
    expect(flagEmoji('NG')).toBe('🇳🇬');
    expect(flagEmoji('US')).toBe('🇺🇸');
    expect(flagEmoji('gb')).toBe('🇬🇧');
  });
});
