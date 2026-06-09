export function generateStaticParams() {
  return [{ slug: 'demo-turismo' }];
}

export default function TurismoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
