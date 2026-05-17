import { useEffect, useMemo, useState } from 'react';
import { resetAndReload } from '../../shared/utils/resetLocalAppData';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { collectDiagnostics, type DiagnosticReport } from './diagnostics';

export function DebugPage() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [copyState, setCopyState] = useState('');
  const reportJson = useMemo(() => JSON.stringify(report, null, 2), [report]);
  const canClipboard = !!navigator.clipboard?.writeText;

  useEffect(() => {
    void collectDiagnostics().then(setReport);
  }, []);

  async function copyDiagnostics() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(reportJson);
      setCopyState('Диагностика скопирована.');
    } catch {
      setCopyState('Не удалось скопировать автоматически. Скопируйте текст ниже.');
    }
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-6">
      <main className="mx-auto grid max-w-3xl gap-4">
        <Card>
          <h1 className="text-2xl font-black">Диагностика Вязалки</h1>
          <p className="mt-2 text-sm text-stone-700">Этот экран помогает понять, почему приложение могло не открыться на устройстве.</p>
        </Card>

        {report?.inAppBrowser ? (
          <Card className="border-amber-200 bg-amber-50 text-amber-900">
            Если приложение не работает, откройте ссылку в Safari/Chrome, а не во встроенном браузере {report.inAppBrowser}.
          </Card>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-3">
          <Button type="button" onClick={copyDiagnostics} disabled={!report || !canClipboard}>
            Скопировать диагностику
          </Button>
          <Button type="button" variant="danger" onClick={() => void resetAndReload()}>
            Сбросить локальные данные
          </Button>
          <Button type="button" variant="secondary" onClick={() => window.location.assign('/')}>
            На главную
          </Button>
        </div>
        {copyState ? <p className="text-sm font-semibold text-moss">{copyState}</p> : null}

        <Card>
          {report ? (
            <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words text-xs">{reportJson}</pre>
          ) : (
            <p>Собираю диагностику...</p>
          )}
        </Card>

        {!canClipboard && report ? (
          <textarea className="min-h-64 rounded-lg border border-flax bg-white p-3 text-xs" readOnly value={reportJson} />
        ) : null}
      </main>
    </div>
  );
}
