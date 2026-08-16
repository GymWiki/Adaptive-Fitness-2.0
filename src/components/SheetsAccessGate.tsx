import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/Button'
import { ErrorState, Spinner } from './ui/States'

/**
 * Blocks every /app and /onboarding route until the Sheets/Drive session is
 * established. Renders a real button for the consent grant — clicking it is
 * what makes the OAuth popup a genuine user gesture, see AuthContext's
 * grantSheetsAccess and sheetsAuth.ts.
 */
export function SheetsAccessGate() {
  const { sheetsReady, needsSheetsConsent, grantingSheetsAccess, grantSheetsAccess, authError, clearAuthError } =
    useAuth()

  if (sheetsReady) return <Outlet />

  if (needsSheetsConsent) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <h1 className="font-display text-xl font-bold">Toegang tot je Google Sheet</h1>
        <p className="mt-2 text-sm text-ink-dim">
          Fitness Log slaat al je data op in een spreadsheet in jouw eigen Google Drive — daar hebben we
          nog toestemming voor nodig.
        </p>
        {authError && (
          <div className="mt-4">
            <ErrorState message={authError} />
          </div>
        )}
        <Button
          onClick={() => {
            clearAuthError()
            grantSheetsAccess()
          }}
          disabled={grantingSheetsAccess}
          fullWidth
          className="mt-6"
        >
          {grantingSheetsAccess ? 'Bezig...' : 'Toegang verlenen'}
        </Button>
      </div>
    )
  }

  return <Spinner label="Toegang tot je Google Sheet controleren" />
}
