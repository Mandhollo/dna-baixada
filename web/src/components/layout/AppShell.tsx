'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

const HIDE_HEADER_FOOTER = ['/dashboard', '/admin'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = HIDE_HEADER_FOOTER.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (hideChrome) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
