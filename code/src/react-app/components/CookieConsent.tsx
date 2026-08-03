import { useEffect, useState } from 'react';

const STORAGE_KEY = 'inntag_cookie_consent';

/**
 * Banner de consentimento LGPD. Aparece até o usuário aceitar ou rejeitar cookies
 * não essenciais; a escolha fica salva em localStorage.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* localStorage indisponível — não mostra */
    }
  }, []);

  const decide = (value: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, at: new Date().toISOString() }));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies e privacidade"
      className="fixed bottom-0 inset-x-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-neutral-700 bg-neutral-900/95 backdrop-blur px-5 py-4 shadow-2xl sm:flex sm:items-center sm:gap-6">
        <p className="text-sm leading-relaxed text-neutral-300">
          Usamos cookies para melhorar sua experiência e analisar o tráfego do site. Ao continuar,
          você concorda com o uso de cookies não essenciais, conforme a{' '}
          <a href="/privacidade" className="text-red-400 underline underline-offset-2 hover:text-red-300">
            nossa política de privacidade
          </a>{' '}
          (LGPD).
        </p>
        <div className="mt-4 flex gap-3 sm:mt-0 sm:flex-shrink-0">
          <button
            type="button"
            onClick={() => decide('rejected')}
            className="rounded-full border border-neutral-600 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-800"
          >
            Só essenciais
          </button>
          <button
            type="button"
            onClick={() => decide('accepted')}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
