import { useInstallPrompt } from '../hooks/useInstallPrompt'

function detectPlatform() {
  const ua = window.navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

export function InstallCard() {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt()
  const platform = detectPlatform()

  if (isInstalled) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Installeer Fitness Log op je telefoon
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Werkt offline, staat op je startscherm, geen appstore nodig.
      </p>

      {canInstall && (
        <button
          onClick={promptInstall}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Installeer app
        </button>
      )}

      {!canInstall && platform === 'ios' && (
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li>
            Tik op het <strong>Deel</strong>-icoon onderin Safari
          </li>
          <li>
            Kies <strong>Zet op beginscherm</strong>
          </li>
          <li>
            Tik op <strong>Voeg toe</strong>
          </li>
        </ol>
      )}

      {!canInstall && platform === 'android' && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Open het menu (⋮) rechtsboven in Chrome en kies <strong>App installeren</strong>.
        </p>
      )}

      {!canInstall && platform === 'desktop' && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Klik op het installatie-icoon in de adresbalk van je browser, of gebruik het browsermenu
          → <strong>App installeren</strong>.
        </p>
      )}
    </div>
  )
}
