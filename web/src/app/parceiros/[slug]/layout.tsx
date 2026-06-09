export function generateStaticParams() {
  return [{ slug: 'demo-parceiro' }];
}

export default function ParceiroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
