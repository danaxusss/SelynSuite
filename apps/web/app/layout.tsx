import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Selyn Suite — Logiciels SaaS marocains',
    template: '%s · Selyn',
  },
  description:
    'Selyn Suite — la plateforme SaaS marocaine pour la gestion des PME. SelynPaie : la paie sans complexité, conforme à la législation marocaine.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Selyn',
  authors: [{ name: 'Selyn Business Center' }],
  keywords: ['paie', 'maroc', 'SaaS', 'CNSS', 'IR', 'AMO', 'fiduciaire', 'PME'],
  formatDetection: { email: false, address: false, telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-MA" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
