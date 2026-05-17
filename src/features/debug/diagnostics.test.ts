import { describe, expect, it } from 'vitest';
import { collectDiagnostics } from './diagnostics';

describe('collectDiagnostics', () => {
  it('collects diagnostics even when optional APIs may be missing', async () => {
    const report = await collectDiagnostics();

    expect(report.app).toBe('Вязалка');
    expect(report.url).toContain('http');
    expect(report.support).toHaveProperty('indexedDB');
    expect(report.support).toHaveProperty('cryptoRandomUUID');
  });
});
