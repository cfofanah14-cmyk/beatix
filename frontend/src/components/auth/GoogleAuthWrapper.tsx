'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

// IMPORTANT: GoogleOAuthProvider MUST be in a 'use client' component.
// If you put it directly in layout.tsx (which is a Server Component by default),
// it will silently fail. Use this wrapper instead.

export default function GoogleAuthWrapper({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      {children}
    </GoogleOAuthProvider>
  );
}
