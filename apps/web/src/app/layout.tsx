import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono, Special_Elite } from 'next/font/google';
import { WhatsAppFloat } from '@/components/whatsapp-float';
import './globals.css';

// Enhanced brand system — see docs/ARCHITECTURE.md §8.8. IBM Plex Sans is body/headings, IBM Plex Mono is for
// labels/technical details (eyebrow text, IDs, footnotes), Special Elite (a
// typewriter display face) is reserved for logotype/wordmark moments only — it's
// not a general heading font.
const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-plex-sans' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-plex-mono' });
const specialElite = Special_Elite({ subsets: ['latin'], weight: '400', variable: '--font-special-elite' });

export const metadata: Metadata = {
  title: 'Nawill App',
  description: 'Client portal & operations platform for Nawill Technology Ltd.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} ${specialElite.variable}`}>
      <body className="min-h-screen bg-white font-sans text-neutral-700 antialiased">
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
