import { describe, expect, it } from 'vitest';
import { cmToRows, cmToStitches, deriveGauge } from './gauge';

describe('gauge calculations', () => {
  it('derives stitches and rows per cm', () => {
    expect(deriveGauge({ stitchesPer10cm: 22, rowsPer10cm: 30 })).toEqual({
      stitchesPerCm: 2.2,
      rowsPerCm: 3,
    });
  });

  it('converts cm to rounded stitches', () => {
    expect(cmToStitches(52, 2.2)).toBe(114);
  });

  it('converts cm to rounded rows', () => {
    expect(cmToRows(37.5, 3)).toBe(113);
  });
});
