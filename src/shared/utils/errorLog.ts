export type StoredError = {
  message: string;
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  timestamp: string;
  userAgent: string;
  url: string;
};

export const LAST_ERROR_KEY = 'vyazalka:lastError';

export function storeLastError(error: unknown, extra: Partial<StoredError> = {}): StoredError {
  const normalized = normalizeError(error, extra);

  try {
    window.localStorage?.setItem(LAST_ERROR_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage failures; the UI fallback must still render.
  }

  return normalized;
}

export function readLastError(): StoredError | null {
  try {
    const raw = window.localStorage?.getItem(LAST_ERROR_KEY);
    return raw ? (JSON.parse(raw) as StoredError) : null;
  } catch {
    return null;
  }
}

export function installGlobalErrorHandlers(): void {
  window.addEventListener('error', (event) => {
    storeLastError(event.error ?? event.message, {
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    storeLastError(event.reason);
  });
}

export function isChunkLoadError(message: string): boolean {
  return [
    'Failed to fetch dynamically imported module',
    'Loading chunk',
    'Importing a module script failed',
  ].some((pattern) => message.includes(pattern));
}

function normalizeError(error: unknown, extra: Partial<StoredError>): StoredError {
  const message = getErrorMessage(error);
  const stack = error instanceof Error ? error.stack : undefined;

  return {
    message,
    stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...extra,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}
