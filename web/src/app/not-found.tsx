import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-7xl font-bold text-primary">404</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Página não encontrada
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
