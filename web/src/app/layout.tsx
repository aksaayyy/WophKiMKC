import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HookClip - YouTube Hook Clip Generator',
  description: 'Generate engaging hook clips from YouTube videos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Block Sentry requests
              (function() {
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                  const url = args[0];
                  if (typeof url === 'string' && url.includes('sentry.io')) {
                    return Promise.resolve(new Response('{}', { status: 200 }));
                  }
                  return originalFetch.apply(this, args);
                };
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
