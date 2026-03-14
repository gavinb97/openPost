import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'OnlyPosts — AI Social Media Agents',
  description: 'Automate your social media with intelligent AI agents that post, reply, DM, and engage on your behalf.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <AuthProvider>
          {children}
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(234 25% 8%)',
                border: '1px solid hsl(234 15% 15%)',
                color: 'hsl(0 0% 95%)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
