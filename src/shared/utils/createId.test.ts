import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from './createId';

const originalCrypto = globalThis.crypto;

describe('createId', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
    vi.restoreAllMocks();
  });

  it('uses getRandomValues when randomUUID is unavailable', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        getRandomValues: (bytes: Uint8Array) => {
          bytes.forEach((_, index) => {
            bytes[index] = index;
          });
          return bytes;
        },
      },
    });

    expect(createId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('falls back to local id without crypto', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined,
    });

    expect(createId()).toMatch(/^local-\d+-[a-z0-9]+$/);
  });
});
