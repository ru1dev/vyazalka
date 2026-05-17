import type { Gauge, GaugeDerived } from '../../entities/project/types';
import { roundToTwoDecimals } from '../utils/rounding';

export function deriveGauge(gauge: Gauge): GaugeDerived {
  if (gauge.stitchesPer10cm <= 0 || gauge.rowsPer10cm <= 0) {
    throw new Error('Плотность должна быть больше нуля.');
  }

  return {
    stitchesPerCm: roundToTwoDecimals(gauge.stitchesPer10cm / 10),
    rowsPerCm: roundToTwoDecimals(gauge.rowsPer10cm / 10),
  };
}

export function cmToStitches(cm: number, stitchesPerCm: number): number {
  return Math.round(cm * stitchesPerCm);
}

export function cmToRows(cm: number, rowsPerCm: number): number {
  return Math.round(cm * rowsPerCm);
}
