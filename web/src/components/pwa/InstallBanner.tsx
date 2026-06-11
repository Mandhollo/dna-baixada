'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('pwa-dismissed');
    if (wasDismissed) return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredInstallPrompt = e;
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show banner after 3 seconds on mobile even without prompt
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      setTimeout(() => setShowBanner(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback: show instructions
      alert(
        'Para instalar o app:\n\n' +
        '📱 Android: Toque no menu (⋮) → "Adicionar à tela inicial"\n\n' +
        '🍎 iPhone: Toque no ícone de compartilhar (↑) → "Adicionar à Tela de Início"'
      );
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-[fade-in-up_0.5s_ease-out]">
      <div className="mx-auto max-w-lg rounded-2xl bg-[#0A2463] p-4 shadow-2xl shadow-black/30">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5A623]/20">
            <Smartphone className="h-5 w-5 text-[#F5A623]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">Instale o DNA Baixada</p>
            <p className="mt-0.5 text-xs text-white/70">Acesse rapidamente pelo celular, sem loja de apps!</p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-1 text-white/50 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-[#14A76C] py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98]"
        >
          <Download size={16} />
          Instalar no celular
        </button>
      </div>
    </div>
  );
}
