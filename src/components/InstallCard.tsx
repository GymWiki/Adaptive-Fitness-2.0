import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

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
    <Card className="text-left">
      <h3 className="font-display text-lg font-bold">Installeer Fitness Log op je telefoon</h3>
      <p className="mt-2 text-sm text-ink-dim">
        Werkt offline, staat op je startscherm, geen appstore nodig.
      </p>

      {canInstall && (
        <Button onClick={promptInstall} className="mt-4">
          Installeer app
        </Button>
      )}

      {!canInstall && platform === 'ios' && (
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ink-dim">
          <li>
            Tik op het <strong className="text-ink">Deel</strong>-icoon onderin Safari
          </li>
          <li>
            Kies <strong className="text-ink">Zet op beginscherm</strong>
          </li>
          <li>
            Tik op <strong className="text-ink">Voeg toe</strong>
          </li>
        </ol>
      )}

      {!canInstall && platform === 'android' && (
        <p className="mt-4 text-sm text-ink-dim">
          Open het menu (⋮) rechtsboven in Chrome en kies{' '}
          <strong className="text-ink">App installeren</strong>.
        </p>
      )}

      {!canInstall && platform === 'desktop' && (
        <p className="mt-4 text-sm text-ink-dim">
          Klik op het installatie-icoon in de adresbalk van je browser, of gebruik het browsermenu
          → <strong className="text-ink">App installeren</strong>.
        </p>
      )}
    </Card>
  )
}
