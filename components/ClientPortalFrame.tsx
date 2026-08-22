import { type ReactNode } from 'react';

// The global header and navigation are rendered once in app/layout.tsx.
// This component is intentionally a pass-through so client pages do not
// render a second, unstyled header. It keeps the companyName prop for
// backward compatibility with existing pages.
export default function ClientPortalFrame({
  children
}: {
  children: ReactNode;
  companyName?: string | null;
}) {
  return <>{children}</>;
}
