import { readLastError } from '../../shared/utils/errorLog';

export type DiagnosticReport = {
  app: string;
  version: string;
  buildTime: string;
  url: string;
  userAgent: string;
  platform: string;
  language: string;
  screen: { width: number; height: number };
  viewport: { width: number; height: number };
  online: boolean;
  cookiesEnabled: boolean;
  inAppBrowser: string | null;
  support: Record<string, boolean>;
  lastError: unknown;
  indexedDbProjectCount: number | null;
  indexedDbDatabases: string[] | null;
};

export async function collectDiagnostics(): Promise<DiagnosticReport> {
  const indexedDbInfo = await inspectIndexedDb();

  return {
    app: 'Вязалка',
    version: import.meta.env.VITE_APP_VERSION ?? __APP_VERSION__,
    buildTime: __BUILD_TIME__,
    url: safeValue(() => window.location.href, ''),
    userAgent: safeValue(() => navigator.userAgent, ''),
    platform: safeValue(() => navigator.platform, ''),
    language: safeValue(() => navigator.language, ''),
    screen: {
      width: safeValue(() => window.screen.width, 0),
      height: safeValue(() => window.screen.height, 0),
    },
    viewport: {
      width: safeValue(() => window.innerWidth, 0),
      height: safeValue(() => window.innerHeight, 0),
    },
    online: safeValue(() => navigator.onLine, false),
    cookiesEnabled: safeValue(() => navigator.cookieEnabled, false),
    inAppBrowser: detectInAppBrowser(safeValue(() => navigator.userAgent, '')),
    support: {
      localStorage: testStorage('localStorage'),
      sessionStorage: testStorage('sessionStorage'),
      indexedDB: 'indexedDB' in window && !!window.indexedDB,
      crypto: 'crypto' in globalThis && !!globalThis.crypto,
      cryptoRandomUUID: !!globalThis.crypto?.randomUUID,
      cryptoGetRandomValues: !!globalThis.crypto?.getRandomValues,
      ResizeObserver: 'ResizeObserver' in window,
      structuredClone: 'structuredClone' in globalThis,
      cssSupports: 'CSS' in window && typeof window.CSS?.supports === 'function',
      clipboard: !!navigator.clipboard?.writeText,
    },
    lastError: readLastError(),
    indexedDbProjectCount: indexedDbInfo.projectCount,
    indexedDbDatabases: indexedDbInfo.databases,
  };
}

function safeValue<T>(getter: () => T, fallback: T): T {
  try {
    return getter();
  } catch {
    return fallback;
  }
}

function testStorage(name: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const storage = window[name];
    const key = 'vyazalka:storage-test';
    storage.setItem(key, '1');
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

async function inspectIndexedDb(): Promise<{ projectCount: number | null; databases: string[] | null }> {
  if (!('indexedDB' in window) || !window.indexedDB) {
    return { projectCount: null, databases: null };
  }

  const databases = await listIndexedDbDatabases();
  const projectCount = await countProjectsSafely();
  return { databases, projectCount };
}

async function listIndexedDbDatabases(): Promise<string[] | null> {
  try {
    if (typeof window.indexedDB.databases !== 'function') return null;
    const databases = await window.indexedDB.databases();
    return databases.map((database) => database.name ?? '(без имени)');
  } catch {
    return null;
  }
}

function countProjectsSafely(): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open('vyazalka');
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
      request.onsuccess = () => {
        const db = request.result;
        try {
          if (!db.objectStoreNames.contains('projects')) {
            db.close();
            resolve(null);
            return;
          }
          const transaction = db.transaction('projects', 'readonly');
          const countRequest = transaction.objectStore('projects').count();
          countRequest.onsuccess = () => {
            db.close();
            resolve(countRequest.result);
          };
          countRequest.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch {
          db.close();
          resolve(null);
        }
      };
    } catch {
      resolve(null);
    }
  });
}

function detectInAppBrowser(userAgent: string): string | null {
  const patterns: Array<[string, RegExp]> = [
    ['Telegram', /Telegram/i],
    ['Instagram', /Instagram/i],
    ['Facebook', /FBAN|FBAV|FB_IAB/i],
    ['VK', /VK|VKApp/i],
    ['Line', /Line/i],
    ['WhatsApp', /WhatsApp/i],
    ['WebView', /; wv\)|WebView/i],
  ];

  return patterns.find(([, pattern]) => pattern.test(userAgent))?.[0] ?? null;
}
