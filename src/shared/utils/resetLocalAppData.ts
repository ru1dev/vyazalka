const APP_PREFIX = 'vyazalka';
const KNOWN_DATABASES = ['vyazalka'];

export async function resetLocalAppData(): Promise<void> {
  clearStorage(window.localStorage);
  clearStorage(window.sessionStorage);
  await deleteIndexedDatabases();
}

export async function resetAndReload(): Promise<void> {
  await resetLocalAppData();
  window.location.reload();
}

function clearStorage(storage: Storage | undefined): void {
  if (!storage) return;

  try {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && key.startsWith(APP_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  } catch {
    // Storage may throw in private modes.
  }
}

async function deleteIndexedDatabases(): Promise<void> {
  if (!('indexedDB' in window) || !window.indexedDB) return;

  const names = new Set(KNOWN_DATABASES);

  try {
    const databases = typeof window.indexedDB.databases === 'function' ? await window.indexedDB.databases() : [];
    databases.forEach((database) => {
      if (database.name?.startsWith(APP_PREFIX)) names.add(database.name);
    });
  } catch {
    // indexedDB.databases is not universally available.
  }

  await Promise.all(Array.from(names).map(deleteDatabase));
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}
