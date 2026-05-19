import { storeLastError } from './shared/utils/errorLog';

export function storeStartupFailure(error: unknown): void {
  const stored = storeLastError(error);

  try {
    window.localStorage?.setItem('vyazalka:lastStartupError', JSON.stringify({
      type: 'bootstrap',
      message: stored.message,
      stack: stored.stack ?? '',
      timestamp: stored.timestamp,
      userAgent: stored.userAgent,
      url: stored.url,
    }));
  } catch {
    // Ignore storage failures; the visible fallback below is more important.
  }

  document.body.innerHTML = `
    <main style="font-family: system-ui, sans-serif; padding: 24px; max-width: 720px; margin: 0 auto;">
      <h1>Что-то пошло не так</h1>
      <p>Приложение не смогло загрузиться. Ошибка сохранена в диагностике.</p>
      <p><a href="/debug.html">Открыть диагностику</a></p>
      <pre style="white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px;">${escapeHtml(stored.message)}</pre>
    </main>
  `;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char] ?? char);
}
