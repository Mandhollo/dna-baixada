export function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default function CorridaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
