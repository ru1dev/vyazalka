import type { StoredError } from '../shared/utils/errorLog';
import { isChunkLoadError } from '../shared/utils/errorLog';
import { resetAndReload } from '../shared/utils/resetLocalAppData';
import { Button } from '../shared/ui/Button';
import { Card } from '../shared/ui/Card';

export function ErrorFallback({ error }: { error: StoredError }) {
  const chunkMessage = isChunkLoadError(error.message)
    ? 'Похоже, браузер загрузил старую версию приложения. Обновите страницу.'
    : 'Приложение не смогло загрузиться. Попробуйте обновить страницу или сбросить локальные данные.';

  return (
    <div className="min-h-screen bg-paper px-4 py-6">
      <main className="mx-auto grid max-w-2xl gap-4">
        <Card className="grid gap-4 border-red-200 bg-red-50">
          <div>
            <h1 className="text-2xl font-black text-red-900">Что-то пошло не так</h1>
            <p className="mt-2 text-sm text-red-800">{chunkMessage}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Button type="button" onClick={() => window.location.reload()}>
              Обновить страницу
            </Button>
            <Button type="button" variant="danger" onClick={() => void resetAndReload()}>
              Сбросить локальные данные
            </Button>
            <Button type="button" variant="secondary" onClick={() => window.location.assign('/debug')}>
              Открыть диагностику
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">Техническая информация</h2>
          <dl className="grid gap-2 break-words text-xs text-stone-700">
            <InfoRow label="message" value={error.message} />
            <InfoRow label="url" value={error.url} />
            <InfoRow label="time" value={error.timestamp} />
            <InfoRow label="userAgent" value={error.userAgent} />
            {error.source ? <InfoRow label="source" value={`${error.source}:${error.lineno ?? '-'}:${error.colno ?? '-'}`} /> : null}
            {error.stack ? <InfoRow label="stack" value={error.stack} /> : null}
          </dl>
        </Card>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-ink">{label}</dt>
      <dd className="whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
