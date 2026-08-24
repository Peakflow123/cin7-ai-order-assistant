import { type ReactNode } from 'react';

export default function ClientPortalFrame({
  children
}: {
  children: ReactNode;
  companyName?: string | null;
}) {
  return <>{children}</>;
}
