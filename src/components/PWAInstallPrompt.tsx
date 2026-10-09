import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Verifica se já está rodando como PWA (modo standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detecta iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Captura evento nativo do Chrome/Edge/Samsung Internet
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Exibe o prompt se o usuário ainda não tiver dispensado recentemente
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('[PWA] Aplicativo NutriConnect instalado com sucesso!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('[PWA] Erro ao disparar prompt de instalação:', err);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Salva para não incomodar por 7 dias
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-slideUp">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-200/90 shadow-2xl p-4 sm:p-5 relative overflow-hidden">
        {/* Detalhe de fundo */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-100/70 to-transparent rounded-bl-full pointer-events-none" />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center p-2 shadow-md flex-shrink-0">
            <img src="/leaf.svg" alt="NutriConnect" className="w-7 h-7 filter brightness-0 invert" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                PWA Disponível
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              Instalar o NutriConnect
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instale como aplicativo nativo no seu dispositivo para acesso rápido em tela cheia e funcionamento offline.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {deferredPrompt ? (
            <>
              <button
                onClick={handleDismiss}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Agora não
              </button>
              <Button
                onClick={handleInstallClick}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm px-4 py-2 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar Aplicativo</span>
              </Button>
            </>
          ) : isIOS ? (
            <p className="text-[11px] text-slate-500">
              Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta) e selecione <strong>Adicionar à Tela de Início</strong>.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
