// This is a SERVER component - do NOT add 'use client' here.
// All client-side providers are wrapped in their own 'use client' components below.

import type { Metadata } from 'next';
import GoogleAuthWrapper from './components/auth/GoogleAuthWrapper';
import { AuthProvider } from './lib/AuthContext';

export const metadata: Metadata = {
  title: 'Beatix — Access Every Event, Effortlessly',
  description: 'Online event ticketing for Sierra Leone and West Africa',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/*
          GoogleAuthWrapper is a 'use client' component that wraps GoogleOAuthProvider.
          AuthProvider is also a 'use client' component.
          Both must NOT be used directly in a server component — wrapping them like
          this is the correct Next.js App Router pattern.
        */}
        
          <GoogleAuthWrapper><AuthProvider>
            {children}
          </AuthProvider></GoogleAuthWrapper>
        
      </body>
    </html>
  );
}


