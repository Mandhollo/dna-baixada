import Link from 'next/link';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const quickLinks = [
  { label: 'Início', href: '/' },
  { label: 'Solicitar Corrida', href: '/corrida/solicitar' },
  { label: 'City Tours', href: '/turismo' },
  { label: 'Transfer Aeroporto', href: '/corrida/solicitar' },
  { label: 'Recompensas', href: '/recompensas' },
];

const exploreLinks = [
  { label: 'Pontos Turísticos', href: '/turismo' },
  { label: 'Cruzeiros', href: '/turismo/cruzeiros' },
  { label: 'Eventos', href: '/turismo/eventos' },
  { label: 'Parceiros', href: '/parceiros' },
  { label: 'DNA Social', href: '/social' },
];

const supportLinks = [
  { label: 'Central de Ajuda', href: '/ajuda' },
  { label: 'Termos de Uso', href: '/termos' },
  { label: 'Privacidade', href: '/privacidade' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Cadastro Motorista', href: '/cadastro' },
];

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1 — Logo & description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-1 select-none">
              <span className="text-2xl font-extrabold tracking-tight text-[#F5A623]">
                DNA
              </span>
              <span className="text-2xl font-semibold tracking-tight text-white">
                Baixada
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Plataforma regional de mobilidade, turismo e impacto social na
              Baixada Santista. Cada corrida transforma vidas.
            </p>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com/contato.dnabaixada"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-[#F5A623] hover:text-primary"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61590532599404"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-[#F5A623] hover:text-primary"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href="https://x.com/dnabaixada"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X / Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-[#F5A623] hover:text-primary"
              >
                <XIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Col 2 — Links Rápidos */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5A623]">
              Links Rápidos
            </h3>
            <ul className="mt-4 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Explorar */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5A623]">
              Explorar
            </h3>
            <ul className="mt-4 space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Suporte + Contato */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#F5A623]">
              Suporte
            </h3>
            <ul className="mt-4 space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#F5A623]">
              Contato
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>
                <a
                  href="mailto:contato@dnabaixada.com.br"
                  className="transition-colors hover:text-white"
                >
                  contato@dnabaixada.com.br
                </a>
              </li>
              <li>Santos, SP — Brasil</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© 2026 DNA Baixada. Todos os direitos reservados.</p>
          <p className="flex items-center gap-2">
            <Link href="/termos" className="transition-colors hover:text-white">
              Termos de Uso
            </Link>
            <span>|</span>
            <Link href="/privacidade" className="transition-colors hover:text-white">
              Política de Privacidade
            </Link>
            <span>|</span>
            <Link href="/ajuda" className="transition-colors hover:text-white">
              Ajuda
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
