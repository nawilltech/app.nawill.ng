import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

// Matches the "Icon / Favicon" spec from the brand identity guide (docs/ARCHITECTURE.md
// §8.8) exactly: navy (#20264A) canvas, a rounded tile (#3A4270), the "N" mark in
// Special Elite, colored cream (#F4EEDD). Node runtime (not edge) so the font file
// can be read straight off disk rather than fetched from a font CDN at request time.
export const runtime = 'nodejs';
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  const specialElite = readFileSync(join(process.cwd(), 'public/fonts/SpecialElite-Regular.ttf'));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#20264a',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: '#3a4270',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontFamily: 'Special Elite', fontSize: 30, color: '#f4eedd' }}>N</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Special Elite', data: specialElite, style: 'normal' }],
    },
  );
}
