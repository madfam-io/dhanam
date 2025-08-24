import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '~/lib/providers';
import { Toaster } from 'sonner';
import '~/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dhanam - Budget & Wealth Tracker',
  description: 'Comprehensive financial management for personal and business',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
