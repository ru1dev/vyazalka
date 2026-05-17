import { describe, expect, it } from 'vitest';
import { resetLocalAppData } from './resetLocalAppData';

describe('resetLocalAppData', () => {
  it('does not throw when storage APIs are unavailable or restricted', async () => {
    await expect(resetLocalAppData()).resolves.toBeUndefined();
  });
});
