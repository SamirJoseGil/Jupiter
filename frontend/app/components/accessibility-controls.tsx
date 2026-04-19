import { useEffect, useState } from "react";
import { AccessibilityIcon } from "./icons";

type AccessibilityPreferences = {
  highContrast: boolean;
  largeText: boolean;
  readableFont: boolean;
  reduceMotion: boolean;
  underlineLinks: boolean;
  visualAlerts: boolean;
};

const STORAGE_KEY = "jupiter_accessibility_preferences";

const defaultPreferences: AccessibilityPreferences = {
  highContrast: false,
  largeText: false,
  readableFont: false,
  reduceMotion: false,
  underlineLinks: false,
  visualAlerts: false,
};

export default function AccessibilityControls() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaultPreferences);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedPreferences = window.localStorage.getItem(STORAGE_KEY);
    if (storedPreferences) {
      try {
        const parsed = JSON.parse(storedPreferences) as AccessibilityPreferences;
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error("Invalid accessibility preferences", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const body = window.document.body;
    body.classList.toggle("a11y-high-contrast", preferences.highContrast);
    body.classList.toggle("a11y-large-text", preferences.largeText);
    body.classList.toggle("a11y-readable-font", preferences.readableFont);
    body.classList.toggle("a11y-reduce-motion", preferences.reduceMotion);
    body.classList.toggle("a11y-underline-links", preferences.underlineLinks);
    body.classList.toggle("a11y-visual-alerts", preferences.visualAlerts);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const togglePreference = (key: keyof AccessibilityPreferences) => {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  const readPage = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const main = document.querySelector("main");
    const text = (main?.textContent || document.body.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 2000));
    utterance.lang = "es-CO";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[60]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="accessibility-panel"
        aria-label="Abrir menú de accesibilidad"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 font-semibold text-cyan-800 shadow-md transition hover:bg-cyan-100"
      >
        <AccessibilityIcon className="w-5 h-5" />
        <span className="hidden sm:inline text-sm">Accesibilidad</span>
      </button>

      {open && (
        <section
          id="accessibility-panel"
          className="mt-3 w-[20rem] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
          aria-label="Opciones de accesibilidad"
        >
          <h2 className="text-base font-bold text-slate-900">Opciones de accesibilidad</h2>
          <p className="mt-1 text-xs text-slate-600">
            Ajusta contraste, tamaño de texto y lectura asistida.
          </p>

          <div className="mt-4 space-y-2 text-sm">
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Alto contraste</span>
              <input
                type="checkbox"
                checked={preferences.highContrast}
                onChange={() => togglePreference("highContrast")}
                aria-label="Activar alto contraste"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Texto grande</span>
              <input
                type="checkbox"
                checked={preferences.largeText}
                onChange={() => togglePreference("largeText")}
                aria-label="Activar texto grande"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Fuente legible</span>
              <input
                type="checkbox"
                checked={preferences.readableFont}
                onChange={() => togglePreference("readableFont")}
                aria-label="Activar fuente legible"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Reducir movimiento</span>
              <input
                type="checkbox"
                checked={preferences.reduceMotion}
                onChange={() => togglePreference("reduceMotion")}
                aria-label="Activar reducción de movimiento"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Subrayar enlaces</span>
              <input
                type="checkbox"
                checked={preferences.underlineLinks}
                onChange={() => togglePreference("underlineLinks")}
                aria-label="Activar subrayado de enlaces"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span>Alertas visuales reforzadas</span>
              <input
                type="checkbox"
                checked={preferences.visualAlerts}
                onChange={() => togglePreference("visualAlerts")}
                aria-label="Activar alertas visuales reforzadas"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={readPage}
              className="rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
            >
              Leer página
            </button>
            <button
              type="button"
              onClick={resetPreferences}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Restablecer
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
